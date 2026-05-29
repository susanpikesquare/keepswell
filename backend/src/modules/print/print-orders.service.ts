import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PDFDocument } from 'pdf-lib';

import type { BookShippingAddress } from '../../database/entities';
import { ExportService } from '../export/export.service';
import { LuluService } from './lulu.service';

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
    private readonly lulu: LuluService,
    private readonly config: ConfigService,
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

  async estimate(clerkId: string, input: EstimateInput): Promise<EstimateResult> {
    // 1. Render the interior + count pages. generatePdf also enforces that
    //    the requester owns the journal, so we don't re-check here.
    const pdf = await this.exportService.generatePdf(input.journalId, clerkId, {
      pageSize: this.trimToPageSize(input.trimSize),
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
}
