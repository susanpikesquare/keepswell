import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PDFDocument } from 'pdf-lib';

import { BookOrder, Journal, User } from '../../database/entities';
import type { BookShippingAddress } from '../../database/entities';
import { ExportService } from '../export/export.service';
import { StorageService } from '../storage/storage.service';
import { LuluService } from './lulu.service';
import type { CoverDimensions } from './print-provider.interface';

export interface EstimateInput {
  journalId: string;
  trimSize: string; // '6x9' | '8x10' | '8.5x11'
  binding: string; // 'perfect' | 'hardcover' | 'saddle' | 'coil'
  quantity: number;
  shippingAddress: BookShippingAddress;
  shippingLevel: string; // MAIL, GROUND, EXPEDITED, …
}

export interface EstimateResult {
  currency: string;
  pageCount: number;
  podPackageId: string;
  // All money in integer cents.
  printCostCents: number; // Lulu's print charge to us
  shippingCents: number; // Lulu shipping (passed through at cost)
  markupPercent: number;
  markupCents: number; // our margin
  retailTotalCents: number; // what the customer pays
}

/**
 * Computes a customer-facing price for printing a journal as a physical
 * book. The flow:
 *   1. Render the interior PDF (reusing the existing export service) and
 *      count its pages — Lulu prices by page count.
 *   2. Resolve the size/binding choice into a Lulu pod_package_id.
 *   3. Ask Lulu (sandbox) for the print + shipping cost.
 *   4. Add our markup (default +40%, env-tunable) and return the breakdown.
 *
 * This is the first end-to-end exercise of the Lulu integration and needs
 * no Stripe or PDF hosting — handy for verifying sandbox auth + cost calc.
 */
@Injectable()
export class PrintOrdersService {
  private readonly logger = new Logger(PrintOrdersService.name);

  constructor(
    private readonly exportService: ExportService,
    private readonly storage: StorageService,
    private readonly lulu: LuluService,
    private readonly config: ConfigService,
    @InjectRepository(BookOrder)
    private readonly orderRepo: Repository<BookOrder>,
    @InjectRepository(Journal)
    private readonly journalRepo: Repository<Journal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /** Markup percentage applied to Lulu's print cost. Env-tunable. */
  private markupPercent(): number {
    const raw = this.config.get<string>('BOOK_MARKUP_PERCENT');
    const n = raw != null ? Number(raw) : 40;
    return Number.isFinite(n) && n >= 0 ? n : 40;
  }

  /** Map our trim-size choice to the export service's page-size option. */
  private trimToPageSize(trimSize: string): 'letter' | '6x9' | '8x10' {
    switch (trimSize) {
      case '6x9':
        return '6x9';
      case '8x10':
        return '8x10';
      case '8.5x11':
      default:
        return 'letter'; // letter == 8.5×11
    }
  }

  private async countPages(pdf: Buffer): Promise<number> {
    const doc = await PDFDocument.load(pdf);
    return doc.getPageCount();
  }

  /**
   * Render + host the interior PDF and resolve the print spec for a journal.
   * This is the de-risking step before we generate the cover and submit a
   * job: it confirms (a) our PDF hosts at a public URL Lulu can fetch, and
   * (b) the pod_package_id is a real product (Lulu returns cover dimensions
   * for it). Returns everything the cover-generation + submit step will need.
   *
   * No Lulu job is created and nothing is charged.
   */
  async prepare(
    clerkId: string,
    input: { journalId: string; trimSize: string; binding: string },
  ): Promise<{
    pageCount: number;
    podPackageId: string;
    interiorPdfUrl: string;
    coverDimensions: CoverDimensions;
  }> {
    // 1. Render the interior (also enforces journal ownership) + count pages.
    const pdf = await this.exportService.generatePdf(input.journalId, clerkId, {
      pageSize: this.trimToPageSize(input.trimSize),
      forPrint: true, // full book, requested size, no watermark — regardless of tier
    });
    const pageCount = await this.countPages(pdf);

    // 2. Resolve the Lulu package id.
    const podPackageId = this.lulu.resolvePackageId({
      trimSize: input.trimSize,
      binding: input.binding,
      color: true,
    });

    // 3. Host the interior PDF (publicId keyed to the journal so re-prepares
    //    overwrite rather than accumulate).
    const interiorPdfUrl = await this.storage.uploadPdf(
      pdf,
      `interior-${input.journalId}`,
    );

    // 4. Ask Lulu for the cover dimensions — this also validates the package
    //    id is real (Lulu 400s on an unknown pod_package_id).
    const coverDimensions = await this.lulu.getCoverDimensions(podPackageId, pageCount);

    this.logger.log(
      `Prepared print assets journal=${input.journalId} pages=${pageCount} ` +
        `pkg=${podPackageId} cover=${coverDimensions.widthPt}x${coverDimensions.heightPt}pt ` +
        `spine=${coverDimensions.spinePt}pt`,
    );

    return { pageCount, podPackageId, interiorPdfUrl, coverDimensions };
  }

  async estimate(clerkId: string, input: EstimateInput): Promise<EstimateResult> {
    // 1. Render the interior + count pages. generatePdf also enforces that
    //    the requester owns the journal, so we don't re-check here.
    const pdf = await this.exportService.generatePdf(input.journalId, clerkId, {
      pageSize: this.trimToPageSize(input.trimSize),
      forPrint: true, // full book, requested size, no watermark — regardless of tier
    });
    const pageCount = await this.countPages(pdf);

    // 2. Resolve the Lulu package id from the size/binding choice.
    const podPackageId = this.lulu.resolvePackageId({
      trimSize: input.trimSize,
      binding: input.binding,
      color: true,
    });

    // 3. Ask Lulu for the cost.
    const cost = await this.lulu.calculateCost(
      { packageId: podPackageId, pageCount, quantity: input.quantity },
      input.shippingAddress,
      input.shippingLevel,
    );

    // 4. Apply markup. Markup is a % of the print cost only; shipping is
    //    passed through to the customer at Lulu's cost.
    const markupPercent = this.markupPercent();
    const markupCents = Math.round(cost.printCostCents * (markupPercent / 100));
    const retailTotalCents = cost.printCostCents + markupCents + cost.shippingCents;

    this.logger.log(
      `Estimate journal=${input.journalId} pages=${pageCount} pkg=${podPackageId} ` +
        `print=${cost.printCostCents} ship=${cost.shippingCents} markup=${markupCents} ` +
        `retail=${retailTotalCents} ${cost.currency}`,
    );

    return {
      currency: cost.currency,
      pageCount,
      podPackageId,
      printCostCents: cost.printCostCents,
      shippingCents: cost.shippingCents,
      markupPercent,
      markupCents,
      retailTotalCents,
    };
  }

  /**
   * Submit a FREE sandbox print job end-to-end: render + host the interior,
   * compute cover dimensions, generate + host the cover, persist a
   * BookOrder, and create the Lulu print job. No Stripe — this validates
   * the write-path (does Lulu accept our PDFs?) before we wire payment.
   *
   * The shipping address is required by Lulu even in sandbox; callers pass
   * a real or test address.
   */
  async submitSandboxPrint(
    clerkId: string,
    input: {
      journalId: string;
      trimSize: string;
      binding: string;
      shippingAddress: BookShippingAddress;
      shippingLevel: string;
    },
  ): Promise<{ orderId: string; jobId: string; status: string }> {
    const user = await this.userRepo.findOne({ where: { clerk_id: clerkId } });
    if (!user) throw new NotFoundException('User not found');
    const journal = await this.journalRepo.findOne({ where: { id: input.journalId } });
    if (!journal) throw new NotFoundException('Journal not found');

    // 1. Render + host the interior, resolve package id + cover dimensions.
    const prep = await this.prepare(clerkId, {
      journalId: input.journalId,
      trimSize: input.trimSize,
      binding: input.binding,
    });

    // 2. Generate + host the cover at Lulu's exact dimensions.
    const coverPdf = await this.exportService.generateCoverPdf(
      input.journalId,
      clerkId,
      prep.coverDimensions.widthPt,
      prep.coverDimensions.heightPt,
    );
    const coverPdfUrl = await this.storage.uploadPdf(coverPdf, `cover-${input.journalId}`);

    // 3. Persist a draft order so we can reconcile the Lulu job to it.
    const order = await this.orderRepo.save(
      this.orderRepo.create({
        journal_id: input.journalId,
        user_id: user.id,
        status: 'submitted',
        pod_package_id: prep.podPackageId,
        trim_size: input.trimSize,
        binding: input.binding,
        page_count: prep.pageCount,
        quantity: 1,
        interior_pdf_url: prep.interiorPdfUrl,
        cover_pdf_url: coverPdfUrl,
        shipping_address: input.shippingAddress,
        shipping_level: input.shippingLevel,
      }),
    );

    // 4. Submit the print job to Lulu (sandbox = free, validates our files).
    try {
      const job = await this.lulu.createPrintJob({
        externalId: order.id,
        title: journal.title || 'Keepswell memory book',
        contactEmail: user.email,
        packageId: prep.podPackageId,
        pageCount: prep.pageCount,
        quantity: 1,
        interiorPdfUrl: prep.interiorPdfUrl,
        coverPdfUrl,
        shippingAddress: input.shippingAddress,
        shippingLevel: input.shippingLevel,
      });
      order.lulu_job_id = job.jobId;
      order.printer_status = job.status;
      await this.orderRepo.save(order);
      this.logger.log(
        `Sandbox print job ${job.jobId} (${job.status}) for order ${order.id}`,
      );
      return { orderId: order.id, jobId: job.jobId, status: job.status };
    } catch (err) {
      order.status = 'error';
      order.error_message = (err as Error).message;
      await this.orderRepo.save(order);
      throw err;
    }
  }

  /**
   * Re-fetch a BookOrder's Lulu status (file validation / production /
   * shipping), update the stored row, and return it. Owner-scoped.
   */
  async getOrderStatus(clerkId: string, orderId: string): Promise<BookOrder> {
    const user = await this.userRepo.findOne({ where: { clerk_id: clerkId } });
    if (!user) throw new NotFoundException('User not found');
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order || order.user_id !== user.id) {
      throw new NotFoundException('Order not found');
    }
    if (order.lulu_job_id) {
      try {
        const status = await this.lulu.getPrintJobStatus(order.lulu_job_id);
        order.printer_status = status.status;
        if (status.trackingUrl) order.tracking_url = status.trackingUrl;
        await this.orderRepo.save(order);
      } catch (err) {
        this.logger.warn(`Could not refresh Lulu status for order ${orderId}: ${(err as Error).message}`);
      }
    }
    return order;
  }
}
