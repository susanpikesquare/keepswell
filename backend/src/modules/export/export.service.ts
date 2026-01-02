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

    // Determine if user is premium
    const isPremium = user.subscription_tier === 'premium' && user.subscription_status === 'active';

    // Get entries with participants and media
    const entries = await this.entryRepository.find({
      where: { journal_id: journalId, is_hidden: false },
      relations: ['participant', 'media_attachments', 'prompt_send', 'prompt_send.scheduled_prompt', 'prompt_send.scheduled_prompt.prompt'],
      order: { created_at: 'ASC' },
    });

    // Limit entries for free tier
    const maxEntries = isPremium ? Infinity : 50;
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
      showWatermark: !isPremium,
      showTableOfContents: isPremium && (options.includeTableOfContents ?? true),
      entryCount: entries.length,
      limitedCount: limitedEntries.length,
      wasTruncated: entries.length > maxEntries,
    };

    // Render HTML
    const template = this.getTemplate();
    const html = template(templateData);

    // Get page dimensions based on size
    const pageDimensions = this.getPageDimensions(isPremium ? options.pageSize : 'letter');

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'Letter',
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

      this.logger.log(`Generated PDF for journal ${journalId} (${limitedEntries.length} entries)`);

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
