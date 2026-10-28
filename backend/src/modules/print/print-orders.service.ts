import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PDFDocument } from 'pdf-lib';

import { BookOrder, Entry, Journal, User } from '../../database/entities';
import type { BookShippingAddress } from '../../database/entities';
import { ExportService } from '../export/export.service';
import { StorageService } from '../storage/storage.service';
import { LuluService } from './lulu.service';
import { PaymentsService } from '../payments/payments.service';
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
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
    @InjectRepository(BookOrder)
    private readonly orderRepo: Repository<BookOrder>,
    @InjectRepository(Journal)
    private readonly journalRepo: Repository<Journal>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Entry)
    private readonly entryRepo: Repository<Entry>,
  ) {}

  /** Markup percentage applied to Lulu's print cost. Env-tunable. */
  private markupPercent(): number {
    const raw = this.config.get<string>('BOOK_MARKUP_PERCENT');
    const n = raw != null ? Number(raw) : 40;
    return Number.isFinite(n) && n >= 0 ? n : 40;
  }

  /**
   * The only trim sizes we offer — both validated against the Lulu sandbox
   * AND renderable by the export template at a matching interior size.
   */
  private static readonly SUPPORTED_TRIM_SIZES = ['6x9', '8.5x11'];

  /**
   * Reject any trim size we don't fully support. This is the single guard
   * that keeps the interior page size (trimToPageSize) and the Lulu trim
   * code (LuluService.resolvePackageId) from diverging — without it a
   * client passing e.g. '8x10' would get an 8×10 interior submitted under
   * an 8.5×11 trim code and Lulu would reject the job.
   */
  private assertSupportedTrim(trimSize: string): void {
    if (!PrintOrdersService.SUPPORTED_TRIM_SIZES.includes(trimSize)) {
      throw new BadRequestException(
        `Unsupported trim size "${trimSize}". Choose one of: ${PrintOrdersService.SUPPORTED_TRIM_SIZES.join(', ')}.`,
      );
    }
  }

  /** Map our (already-validated) trim-size choice to the export page size. */
  private trimToPageSize(trimSize: string): 'letter' | '6x9' {
    // '8.5x11' renders as 'letter' (identical dimensions); '6x9' is native.
    return trimSize === '6x9' ? '6x9' : 'letter';
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
    this.assertSupportedTrim(input.trimSize);
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
    this.assertSupportedTrim(input.trimSize);
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
   * Submit a FREE sandbox print job end-to-end: prepare the interior,
   * persist a BookOrder in a "ready to submit" state, and run the shared
   * cover-generate-and-submit step. No Stripe — this validates the
   * write-path (does Lulu accept our PDFs?) before we wire payment.
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
    const { user, journal } = await this.assertJournalOwnership(clerkId, input.journalId);

    const prep = await this.prepare(clerkId, {
      journalId: input.journalId,
      trimSize: input.trimSize,
      binding: input.binding,
    });

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        journal_id: input.journalId,
        user_id: user.id,
        // Sandbox has no payment step; treat as pre-paid so the shared
        // submit path (which expects a payment-complete order) accepts it.
        status: 'paid',
        pod_package_id: prep.podPackageId,
        trim_size: input.trimSize,
        binding: input.binding,
        page_count: prep.pageCount,
        quantity: 1,
        interior_pdf_url: prep.interiorPdfUrl,
        shipping_address: input.shippingAddress,
        shipping_level: input.shippingLevel,
      }),
    );

    await this.generateCoverAndSubmit(order, journal, user);
    return {
      orderId: order.id,
      jobId: order.lulu_job_id!,
      status: order.printer_status!,
    };
  }

  /**
   * Create a Stripe Checkout session for a printed book. Prices the order
   * (which also renders + hosts the interior), persists a BookOrder in
   * `awaiting_payment` with the full spec snapshotted (price, shipping,
   * interior URL, page count, pod package), and hands Stripe a dynamic
   * `price_data` line item for the computed total. The webhook handler
   * for `purchaseType=book_order` later finishes the submit.
   *
   * Snapshotting matters: the price shown on the review page is what the
   * customer pays, and the interior they review is what gets printed —
   * even if they edit the book between checkout and payment.
   */
  async createBookOrderCheckoutSession(
    clerkId: string,
    input: {
      journalId: string;
      trimSize?: string;
      binding?: string;
      quantity?: number;
      shippingAddress: BookShippingAddress;
      shippingLevel?: string;
      returnUrl: string;
    },
  ): Promise<{ orderId: string; url: string }> {
    this.assertShippingAddress(input.shippingAddress);
    if (!input.returnUrl) throw new BadRequestException('returnUrl is required');
    const trimSize = input.trimSize || '8.5x11';
    const binding = input.binding || 'perfect';
    const quantity = input.quantity && input.quantity > 0 ? input.quantity : 1;
    const shippingLevel = input.shippingLevel || 'MAIL';

    const { user, journal } = await this.assertJournalOwnership(clerkId, input.journalId);

    // Price the order (renders + counts pages) …
    const estimate = await this.estimate(clerkId, {
      journalId: input.journalId,
      trimSize,
      binding,
      quantity,
      shippingAddress: input.shippingAddress,
      shippingLevel,
    });

    // … then prepare the interior so we have a stable hosted URL on the
    // order. estimate() rendered the PDF, but didn't host it; this does.
    const prep = await this.prepare(clerkId, {
      journalId: input.journalId,
      trimSize,
      binding,
    });

    const order = await this.orderRepo.save(
      this.orderRepo.create({
        journal_id: input.journalId,
        user_id: user.id,
        status: 'awaiting_payment',
        pod_package_id: prep.podPackageId,
        trim_size: trimSize,
        binding,
        page_count: prep.pageCount,
        quantity,
        interior_pdf_url: prep.interiorPdfUrl,
        shipping_address: input.shippingAddress,
        shipping_level: shippingLevel,
        currency: estimate.currency,
        print_cost_cents: estimate.printCostCents,
        markup_cents: estimate.markupCents,
        shipping_cents: estimate.shippingCents,
        retail_total_cents: estimate.retailTotalCents,
      }),
    );

    const bookTitle = journal.book_title_override || journal.title || 'Memory book';
    const productName = quantity > 1
      ? `${bookTitle} (printed book × ${quantity})`
      : `${bookTitle} (printed book)`;

    const { url, sessionId } = await this.payments.createBookOrderCheckoutSession(
      user,
      order,
      input.returnUrl,
      { productName },
    );

    order.stripe_checkout_session_id = sessionId;
    await this.orderRepo.save(order);

    this.logger.log(
      `Book-order checkout created: order=${order.id} session=${sessionId} ` +
        `retail=${estimate.retailTotalCents}c ${estimate.currency}`,
    );
    return { orderId: order.id, url };
  }

  /**
   * Called by the Stripe webhook when a book-order checkout completes.
   * Marks the order paid, then submits to Lulu via the shared submit
   * step. Idempotent — a repeat delivery of the same event (Stripe
   * retries on 5xx) is a no-op once the order has advanced past
   * `awaiting_payment`.
   *
   * Lulu failures are caught so the webhook can respond 200 and Stripe
   * doesn't retry (which would eventually create duplicate print jobs);
   * the order parks in `status=error` with the message for manual
   * follow-up.
   */
  async markBookOrderPaidAndSubmit(
    bookOrderId: string,
    stripePaymentIntentId: string | null,
  ): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: bookOrderId } });
    if (!order) {
      this.logger.warn(`Webhook referenced unknown book order ${bookOrderId}`);
      return;
    }
    if (order.status !== 'awaiting_payment' && order.status !== 'draft') {
      this.logger.log(
        `Ignoring repeat payment event for order ${bookOrderId} (status=${order.status})`,
      );
      return;
    }

    order.status = 'paid';
    if (stripePaymentIntentId) order.stripe_payment_intent_id = stripePaymentIntentId;
    await this.orderRepo.save(order);

    const user = await this.userRepo.findOne({ where: { id: order.user_id } });
    const journal = await this.journalRepo.findOne({ where: { id: order.journal_id } });
    if (!user || !journal) {
      order.status = 'error';
      order.error_message = 'User or journal missing at submit time';
      await this.orderRepo.save(order);
      this.logger.error(
        `Cannot submit paid order ${bookOrderId}: user or journal missing`,
      );
      return;
    }

    try {
      await this.generateCoverAndSubmit(order, journal, user);
    } catch (err) {
      // generateCoverAndSubmit already set status=error and saved. We
      // swallow here so the webhook responds 200 and Stripe doesn't retry.
      this.logger.error(
        `Lulu submit failed for paid order ${bookOrderId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Shared Lulu-submission step. Assumes the order already has
   * `interior_pdf_url`, `pod_package_id`, and `page_count` populated.
   * Generates + hosts the cover (dimensions re-fetched from Lulu since
   * they depend on page count), creates the print job, and updates the
   * order with `status=submitted` + `lulu_job_id` on success. On failure
   * the order is set to `status=error` and the error is RE-THROWN — the
   * sandbox endpoint surfaces it to the client, the webhook catches it.
   */
  private async generateCoverAndSubmit(
    order: BookOrder,
    journal: Journal,
    user: User,
  ): Promise<void> {
    if (!order.interior_pdf_url || !order.pod_package_id || !order.page_count) {
      throw new BadRequestException(
        `Order ${order.id} missing print assets (interior/package/pages)`,
      );
    }

    try {
      const coverDims = await this.lulu.getCoverDimensions(
        order.pod_package_id,
        order.page_count,
      );
      const coverPdf = await this.exportService.generateCoverPdf(
        order.journal_id,
        user.clerk_id,
        coverDims.widthPt,
        coverDims.heightPt,
      );
      const coverPdfUrl = await this.storage.uploadPdf(coverPdf, `cover-${order.id}`);

      const job = await this.lulu.createPrintJob({
        externalId: order.id,
        title: journal.book_title_override || journal.title || 'Keepswell memory book',
        contactEmail: user.email,
        packageId: order.pod_package_id,
        pageCount: order.page_count,
        quantity: order.quantity,
        interiorPdfUrl: order.interior_pdf_url,
        coverPdfUrl,
        shippingAddress: order.shipping_address,
        shippingLevel: order.shipping_level,
      });

      order.status = 'submitted';
      order.cover_pdf_url = coverPdfUrl;
      order.lulu_job_id = job.jobId;
      order.printer_status = job.status;
      await this.orderRepo.save(order);
      this.logger.log(
        `Submitted print job ${job.jobId} (${job.status}) for order ${order.id}`,
      );
    } catch (err) {
      order.status = 'error';
      order.error_message = (err as Error).message;
      await this.orderRepo.save(order);
      throw err;
    }
  }

  /**
   * Minimal structural validation of a shipping address — Lulu rejects
   * incomplete addresses with a 400, which would otherwise reach the user
   * as a mysterious "something went wrong" after they paid. Field-level
   * format validation (e.g. real ZIP code) is left to Lulu.
   */
  private assertShippingAddress(a: BookShippingAddress | undefined): void {
    if (!a) throw new BadRequestException('Shipping address is required');
    const required: Array<keyof BookShippingAddress> = [
      'name',
      'street1',
      'city',
      'state_code',
      'postcode',
      'country_code',
    ];
    for (const field of required) {
      const v = a[field];
      if (typeof v !== 'string' || v.trim().length === 0) {
        throw new BadRequestException(`Shipping address is missing "${field}"`);
      }
    }
    if (a.country_code.length !== 2) {
      throw new BadRequestException(
        'Shipping country_code must be an ISO-2 code (e.g. "US")',
      );
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

  // ---- Book editor -----------------------------------------------------
  //
  // Three endpoints the book editor UI calls: load the current config +
  // entry list to populate the editor, save edits as the owner tweaks
  // them, and render a preview PDF to show what the printed book will
  // look like before any payment or Lulu job.

  /**
   * Load the owner's current book-editor state for a journal, plus the
   * list of its (visible) entries so the UI can show the include/exclude
   * checkboxes. Owner-scoped — participants and other users can't peek
   * at what the owner is planning to print.
   */
  async getBookConfig(clerkId: string, journalId: string): Promise<{
    title: string;
    journalTitle: string;
    excludedEntryIds: string[];
    entries: Array<{
      id: string;
      content: string;
      participantName: string;
      hasPhoto: boolean;
      createdAt: Date;
    }>;
  }> {
    const { journal } = await this.assertJournalOwnership(clerkId, journalId);
    const entries = await this.entryRepo.find({
      where: { journal_id: journalId, is_hidden: false },
      relations: ['participant', 'media_attachments'],
      order: { created_at: 'ASC' },
    });
    return {
      title: journal.book_title_override ?? journal.title,
      journalTitle: journal.title,
      excludedEntryIds: journal.book_excluded_entry_ids ?? [],
      entries: entries.map((e) => ({
        id: e.id,
        content: e.content,
        participantName: e.participant?.display_name ?? 'Unknown',
        hasPhoto: (e.media_attachments?.length ?? 0) > 0,
        createdAt: e.created_at,
      })),
    };
  }

  /**
   * Save book-editor changes. Any field left undefined is left as-is;
   * passing an empty string for title resets it to the journal name.
   * The excluded-entry list is validated to only contain ids that belong
   * to the journal, so a bad client can't make the next preview silently
   * drop every entry.
   */
  async updateBookConfig(
    clerkId: string,
    journalId: string,
    patch: { title?: string | null; excludedEntryIds?: string[] },
  ): Promise<{ title: string; excludedEntryIds: string[] }> {
    const { journal } = await this.assertJournalOwnership(clerkId, journalId);

    if (patch.title !== undefined) {
      const trimmed = patch.title == null ? null : patch.title.trim();
      journal.book_title_override = trimmed && trimmed.length > 0 ? trimmed : null;
    }

    if (patch.excludedEntryIds !== undefined) {
      const requested = new Set(patch.excludedEntryIds);
      if (requested.size > 0) {
        const owned = await this.entryRepo.find({
          where: { journal_id: journalId },
          select: ['id'],
        });
        const ownedIds = new Set(owned.map((e) => e.id));
        for (const id of requested) {
          if (!ownedIds.has(id)) {
            throw new BadRequestException(
              `Entry ${id} does not belong to journal ${journalId}`,
            );
          }
        }
      }
      journal.book_excluded_entry_ids = Array.from(requested);
    }

    await this.journalRepo.save(journal);
    return {
      title: journal.book_title_override ?? journal.title,
      excludedEntryIds: journal.book_excluded_entry_ids ?? [],
    };
  }

  /**
   * Render the printed interior with the owner's current editor settings
   * and host the PDF so the frontend can display it (iframe/pdf.js/new
   * tab). Returns the hosted URL + page count. No Lulu call, no charge.
   * The publicId is keyed to the journal so each preview overwrites the
   * last — we don't accumulate stale PDFs for a journal that's being
   * actively edited.
   */
  async previewBook(
    clerkId: string,
    journalId: string,
    opts: { trimSize?: string } = {},
  ): Promise<{ pdfUrl: string; pageCount: number }> {
    const trimSize = opts.trimSize ?? '8.5x11';
    this.assertSupportedTrim(trimSize);
    const { journal } = await this.assertJournalOwnership(clerkId, journalId);

    const pdf = await this.exportService.generatePdf(journalId, clerkId, {
      pageSize: this.trimToPageSize(trimSize),
      forPrint: true,
      titleOverride: journal.book_title_override ?? undefined,
      excludeEntryIds: journal.book_excluded_entry_ids ?? [],
    });
    const pageCount = await this.countPages(pdf);
    const pdfUrl = await this.storage.uploadPdf(pdf, `preview-${journalId}`);
    this.logger.log(`Preview rendered journal=${journalId} pages=${pageCount}`);
    return { pdfUrl, pageCount };
  }

  /**
   * Shared ownership check used by the editor endpoints. Returns both the
   * user and the loaded journal so callers don't re-fetch.
   */
  private async assertJournalOwnership(
    clerkId: string,
    journalId: string,
  ): Promise<{ user: User; journal: Journal }> {
    const user = await this.userRepo.findOne({ where: { clerk_id: clerkId } });
    if (!user) throw new NotFoundException('User not found');
    const journal = await this.journalRepo.findOne({ where: { id: journalId } });
    if (!journal) throw new NotFoundException('Journal not found');
    if (journal.owner_id !== user.id) {
      throw new NotFoundException('Journal not found');
    }
    return { user, journal };
  }
}
