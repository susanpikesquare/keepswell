import type { BookShippingAddress } from '../../database/entities';

/**
 * Vendor-agnostic print-on-demand interface. Today the only implementation
 * is LuluService, but keeping this abstraction means the order flow,
 * pricing, and Stripe wiring don't hard-depend on Lulu — we could add a
 * PeechoService or GelatoService later without touching the rest.
 *
 * All money is returned in integer minor units (cents) + a currency code so
 * we never do float math on prices.
 */

export interface BookSpec {
  /** Resolved vendor package id (Lulu pod_package_id). */
  packageId: string;
  pageCount: number;
  quantity: number;
}

export interface CostBreakdown {
  currency: string;
  printCostCents: number; // line-item print cost (all quantity)
  shippingCents: number;
  taxCents: number;
  totalCents: number; // what the vendor charges us
}

export interface CoverDimensions {
  /** Full cover width incl. spine + bleed, in points (1/72"). */
  widthPt: number;
  heightPt: number;
  spinePt: number;
  unit: 'pt';
}

export interface CreatePrintJobInput {
  externalId: string; // our BookOrder id, for reconciliation
  title: string;
  contactEmail: string;
  packageId: string;
  pageCount: number;
  quantity: number;
  interiorPdfUrl: string;
  coverPdfUrl: string;
  shippingAddress: BookShippingAddress;
  shippingLevel: string;
}

export interface PrintJobResult {
  /** Vendor job id (Lulu print-job id). */
  jobId: string;
  /** Verbatim vendor status name (e.g. CREATED). */
  status: string;
}

export interface PrintJobStatus {
  jobId: string;
  status: string; // verbatim vendor status
  trackingUrl?: string;
}

/** Inputs for resolving size/binding choices into a vendor package id. */
export interface PackageOptions {
  trimSize: string; // '6x9' | '8x10' | '8.5x11'
  binding: string; // 'perfect' | 'hardcover' | 'saddle' | 'coil'
  color?: boolean; // full color (default true for photo books)
}

export interface PrintProvider {
  /** True when the provider has credentials configured. */
  isConfigured(): boolean;
  /** Resolve human options into a vendor package id. */
  resolvePackageId(opts: PackageOptions): string;
  /** Required cover dimensions for the given package + page count. */
  getCoverDimensions(packageId: string, pageCount: number): Promise<CoverDimensions>;
  /** Quote the vendor's cost for a spec shipped to an address. */
  calculateCost(
    spec: BookSpec,
    shippingAddress: BookShippingAddress,
    shippingLevel: string,
  ): Promise<CostBreakdown>;
  /** Submit a print + ship job. */
  createPrintJob(input: CreatePrintJobInput): Promise<PrintJobResult>;
  /** Poll a job's current status. */
  getPrintJobStatus(jobId: string): Promise<PrintJobStatus>;
}

export const PRINT_PROVIDER = Symbol('PRINT_PROVIDER');
