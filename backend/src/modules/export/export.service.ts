import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Journal, Entry, User, Participant } from '../../database/entities';

interface ExportOptions {
  pageSize?: 'letter' | '6x9' | '8x10';
  includeTableOfContents?: boolean;
  /**
   * Generate the full, print-ready book regardless of subscription tier:
   * honor the requested pageSize, include ALL entries (no free-tier cap),
   * and drop the watermark. Used when producing the interior PDF for a
   * paid physical-book order — the print itself is the paid product, so the
   * consumer free-tier limits don't apply.
   */
  forPrint?: boolean;
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);
  private templateCache: Handlebars.TemplateDelegate | null = null;

  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(Entry)
    private entryRepository: Repository<Entry>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {
    // Register Handlebars helpers
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });
  }

  private getTemplate(): Handlebars.TemplateDelegate {
    if (this.templateCache) {
      return this.templateCache;
    }

    const templatePath = path.join(__dirname, 'templates', 'book-template.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    this.templateCache = Handlebars.compile(templateSource);
    return this.templateCache;
  }

  async generatePdf(
    journalId: string,
    clerkId: string,
    options: ExportOptions = {},
  ): Promise<Buffer> {
    // Verify user access
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
      relations: ['owner'],
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    if (journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to export this journal');
    }

    // Determine if user is premium. `unlocked` also covers print exports,
    // which always get the full, correctly-sized, watermark-free book
    // regardless of subscription tier (the print order is itself paid).
    const isPremium = user.subscription_tier === 'premium' && user.subscription_status === 'active';
    const unlocked = isPremium || options.forPrint === true;

    // Get entries with participants and media
    const entries = await this.entryRepository.find({
      where: { journal_id: journalId, is_hidden: false },
      relations: ['participant', 'media_attachments', 'prompt_send', 'prompt_send.scheduled_prompt', 'prompt_send.scheduled_prompt.prompt'],
      order: { created_at: 'ASC' },
    });

    // Limit entries for free tier (print + premium get the whole book).
    const maxEntries = unlocked ? Infinity : 50;
    const limitedEntries = entries.slice(0, maxEntries);

    // Get participants summary
    const participants = await this.participantRepository.find({
      where: { journal_id: journalId },
    });

    const participantStats = participants.map((p) => ({
      name: p.display_name,
      entryCount: entries.filter((e) => e.participant_id === p.id).length,
    }));

    // Format entries for template
    const formattedEntries = limitedEntries.map((entry) => ({
      ...entry,
      participantName: entry.participant?.display_name || 'Unknown',
      promptText: (entry.prompt_send as any)?.scheduled_prompt?.prompt?.content || null,
      media_attachments: entry.media_attachments || [],
    }));

    // Prepare template data
    const templateData = {
      journal,
      entries: formattedEntries,
      participants: participantStats,
      showWatermark: !unlocked,
      showTableOfContents: unlocked && (options.includeTableOfContents ?? true),
      entryCount: entries.length,
      limitedCount: limitedEntries.length,
      wasTruncated: entries.length > maxEntries,
    };

    // Render HTML
    const template = this.getTemplate();
    const html = template(templateData);

    // Get page dimensions based on size
    const pageDimensions = this.getPageDimensions(unlocked ? options.pageSize : 'letter');

    // Generate PDF with Puppeteer. We log timing at each step because this is
    // the most failure-prone path in the app: heavy Chromium launch on a
    // memory-constrained Render dyno, plus remote image fetches that can
    // misbehave. When this hangs in prod we need to see exactly which step
    // stalled instead of the request just timing out at the gateway.
    const t0 = Date.now();
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        // --disable-dev-shm-usage is critical on Render: /dev/shm is tiny (~64MB)
        // and Chromium will otherwise crash when rendering image-heavy pages.
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
        ],
      });
      this.logger.log(`PDF[${journalId}] browser launched in ${Date.now() - t0}ms`);

      const tPage = Date.now();
      const page = await browser.newPage();

      // domcontentloaded fires as soon as the HTML is parsed — not after every
      // image network request settles. We then explicitly give images a bounded
      // window (3s) to load via Promise.race, so a single slow/broken Cloudinary
      // URL can't hang the whole export. networkidle0 (the previous setting)
      // would wait the full Puppeteer default of 30s on any stuck request.
      await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20_000 });

      // Wait for images, but cap it. Anything that hasn't loaded in 3s either
      // 404s, is throttled, or is broken — we'd rather render without it than
      // hang the whole export.
      await Promise.race([
        page.evaluate(async () => {
          const imgs = Array.from(document.images);
          await Promise.all(
            imgs.map(
              (img) =>
                img.complete
                  ? Promise.resolve()
                  : new Promise<void>((resolve) => {
                      img.addEventListener('load', () => resolve(), { once: true });
                      img.addEventListener('error', () => resolve(), { once: true });
                    }),
            ),
          );
        }),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
      this.logger.log(`PDF[${journalId}] content + images ready in ${Date.now() - tPage}ms`);

      const tPdf = Date.now();
      // NOTE: passing both `format` and explicit `width`/`height` makes
      // Puppeteer ignore the explicit size — `format` wins. We want the
      // requested size to actually take effect, so only set width/height.
      const pdfBuffer = await page.pdf({
        width: pageDimensions.width,
        height: pageDimensions.height,
        printBackground: true,
        margin: {
          top: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
          right: '0.5in',
        },
      });
      this.logger.log(
        `PDF[${journalId}] pdf rendered in ${Date.now() - tPdf}ms ` +
          `total ${Date.now() - t0}ms entries=${limitedEntries.length} bytes=${pdfBuffer.length}`,
      );

      return Buffer.from(pdfBuffer);
    } catch (err) {
      // Don't let an obscure Chromium failure surface as a generic 500 / gateway
      // timeout. Log the full error in Render so we can see exactly what blew up
      // (browser launch? OOM kill? page.setContent? page.pdf?), then re-throw a
      // clean message to the client.
      this.logger.error(
        `PDF[${journalId}] failed after ${Date.now() - t0}ms: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          this.logger.warn(`PDF[${journalId}] browser close failed: ${(closeErr as Error).message}`);
        }
      }
    }
  }

  /**
   * Generate a full-bleed cover PDF sized to EXACTLY the dimensions Lulu's
   * cover-dimensions endpoint returned (points). Lulu's cover spans
   * back-cover | spine | front-cover left-to-right and already includes
   * bleed, so we render at the exact size with zero page margin and a
   * full-bleed background, placing the title in the front-cover (right)
   * safe area. First-pass design — refined once we see Lulu's file
   * validation on a real (sandbox) job.
   */
  async generateCoverPdf(
    journalId: string,
    clerkId: string,
    coverWidthPt: number,
    coverHeightPt: number,
  ): Promise<Buffer> {
    const user = await this.userRepository.findOne({ where: { clerk_id: clerkId } });
    if (!user) throw new NotFoundException('User not found');

    const journal = await this.journalRepository.findOne({ where: { id: journalId } });
    if (!journal) throw new NotFoundException('Journal not found');
    if (journal.owner_id !== user.id) {
      throw new ForbiddenException('Not authorized to export this journal');
    }

    const widthIn = coverWidthPt / 72;
    const heightIn = coverHeightPt / 72;
    const title = (journal.title || 'Our Memory Book').replace(/</g, '&lt;');
    const bg = journal.cover_image_url
      ? `background-image: linear-gradient(rgba(31,35,40,0.25), rgba(31,35,40,0.45)), url('${journal.cover_image_url}'); background-size: cover; background-position: center;`
      : 'background: linear-gradient(135deg, #DCCCB7 0%, #F5C9BF 100%);';
    const titleColor = journal.cover_image_url ? '#FFFFFF' : '#1F2328';

    // The title sits in the front-cover region (right ~48% of the wrap),
    // inset from the trim edge so it stays inside the safe area regardless
    // of the exact spine width.
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>
      @page { margin: 0; size: ${widthIn}in ${heightIn}in; }
      html, body { margin: 0; padding: 0; width: ${widthIn}in; height: ${heightIn}in; }
      .cover { width: 100%; height: 100%; ${bg} position: relative; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .front { position: absolute; top: 0; right: 0; width: 48%; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 0.75in 0.6in; box-sizing: border-box; text-align: center; }
      .title { font-family: Georgia, 'Times New Roman', serif; font-size: 42pt; line-height: 1.15;
        color: ${titleColor}; margin: 0; }
      .tagline { font-family: Georgia, serif; font-style: italic; font-size: 16pt;
        color: ${titleColor}; opacity: 0.9; margin-top: 0.3in; }
    </style></head><body>
      <div class="cover"><div class="front">
        <h1 class="title">${title}</h1>
        <div class="tagline">A Keepswell memory book</div>
      </div></div>
    </body></html>`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        width: `${widthIn}in`,
        height: `${heightIn}in`,
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      this.logger.log(
        `Generated cover PDF for journal ${journalId} (${widthIn.toFixed(2)}x${heightIn.toFixed(2)}in)`,
      );
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  private getPageDimensions(size: string = 'letter'): { width: string; height: string } {
    switch (size) {
      case '6x9':
        return { width: '6in', height: '9in' };
      case '8x10':
        return { width: '8in', height: '10in' };
      case 'letter':
      default:
        return { width: '8.5in', height: '11in' };
    }
  }
}
