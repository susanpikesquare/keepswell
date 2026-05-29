import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { BookShippingAddress } from '../../database/entities';
import type {
  BookSpec,
  CostBreakdown,
  CoverDimensions,
  CreatePrintJobInput,
  PackageOptions,
  PrintJobResult,
  PrintJobStatus,
  PrintProvider,
} from './print-provider.interface';

/**
 * Lulu Direct (xPress) print-on-demand provider.
 *
 * Auth: OAuth2 client-credentials. We exchange the client key/secret for a
 * bearer token and cache it until shortly before expiry.
 *
 * Endpoints used (relative to the API base):
 *   POST /auth/realms/glasstree/protocol/openid-connect/token
 *   POST /print-job-cost-calculations/
 *   POST /print-jobs/
 *   GET  /print-jobs/{id}/
 *   POST /cover-dimensions/
 *
 * Base URL is env-driven so we run against the sandbox until go-live:
 *   LULU_API_BASE   (default https://api.sandbox.lulu.com)
 *   LULU_CLIENT_KEY
 *   LULU_CLIENT_SECRET
 *
 * NOTE: the exact pod_package_id encoding and a couple of field names should
 * be verified against the sandbox once credentials are set — they're
 * centralized here (resolvePackageId + the request bodies) precisely so that
 * verification touches one file.
 */
@Injectable()
export class LuluService implements PrintProvider {
  private readonly logger = new Logger(LuluService.name);
  private readonly base: string;
  private readonly clientKey?: string;
  private readonly clientSecret?: string;

  private cachedToken?: { accessToken: string; expiresAt: number };

  constructor(private readonly config: ConfigService) {
    this.base =
      this.config.get<string>('LULU_API_BASE') || 'https://api.sandbox.lulu.com';
    this.clientKey = this.config.get<string>('LULU_CLIENT_KEY');
    this.clientSecret = this.config.get<string>('LULU_CLIENT_SECRET');
  }

  isConfigured(): boolean {
    return Boolean(this.clientKey && this.clientSecret);
  }

  /**
   * Diagnostic: attempt to obtain an access token. Returns a small result
   * the status endpoint can surface so we can confirm the sandbox keys are
   * valid without placing an order. Never throws.
   */
  async pingAuth(): Promise<{ ok: boolean; error?: string }> {
    if (!this.isConfigured()) return { ok: false, error: 'not_configured' };
    try {
      await this.getToken();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }

  private ensureConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Printing is not configured yet. Set LULU_CLIENT_KEY and LULU_CLIENT_SECRET.',
      );
    }
  }

  // ---- Auth ------------------------------------------------------------

  private async getToken(): Promise<string> {
    this.ensureConfigured();
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 30_000) {
      return this.cachedToken.accessToken;
    }

    const tokenUrl = `${this.base}/auth/realms/glasstree/protocol/openid-connect/token`;
    const basic = Buffer.from(`${this.clientKey}:${this.clientSecret}`).toString('base64');

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Lulu auth failed (${res.status}): ${text}`);
      throw new ServiceUnavailableException('Could not authenticate with the print provider.');
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      accessToken: data.access_token,
      expiresAt: now + data.expires_in * 1000,
    };
    return data.access_token;
  }

  private async authedFetch(path: string, init: RequestInit): Promise<Response> {
    const token = await this.getToken();
    return fetch(`${this.base}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  // ---- Package id resolution ------------------------------------------

  /**
   * Map our human options to a Lulu pod_package_id. The id encodes (in order)
   * trim size, color, print quality, binding, paper stock, PPI, finish,
   * linen, and foil. We default to full-color, standard quality, 80# coated
   * white, 444 PPI, matte — a sensible photo-book default.
   *
   * Examples (verify against sandbox):
   *   8x10  perfect  color → 0800X1000FCSTDPB080CW444GXX
   *   6x9   perfect  color → 0600X0900FCSTDPB080CW444GXX
   *   8.5x11 perfect color → 0850X1100FCSTDPB080CW444GXX
   *   8x10  hardcover color→ 0800X1000FCSTDCW080CW444GXX (case wrap)
   */
  resolvePackageId(opts: PackageOptions): string {
    const trim = this.trimCode(opts.trimSize);
    const color = opts.color === false ? 'BW' : 'FC';
    const quality = 'STD';
    const binding = this.bindingCode(opts.binding);
    const paper = '080CW'; // 80# coated white
    const ppi = '444';
    const finish = 'G'; // gloss; 'M' for matte
    const linen = 'X';
    const foil = 'X';
    return `${trim}${color}${quality}${binding}${paper}${ppi}${finish}${linen}${foil}`;
  }

  // Validated against the Lulu sandbox: 6x9 and 8.5x11 perfect-bound are
  // real trim keys; 8x10 is NOT ("Unknown trim key: 0800X1000"). We only
  // offer sizes the interior PDF generator can actually render at a
  // matching size (6x9 and letter/8.5x11), so we don't expose other Lulu
  // trims (e.g. square) until the export template supports them.
  private trimCode(trimSize: string): string {
    switch (trimSize) {
      case '6x9':
        return '0600X0900';
      case '8.5x11':
      default:
        return '0850X1100';
    }
  }

  private bindingCode(binding: string): string {
    switch (binding) {
      case 'hardcover':
        return 'CW'; // case wrap
      case 'saddle':
        return 'SS'; // saddle stitch
      case 'coil':
        return 'LW'; // coil / wire-o
      case 'perfect':
      default:
        return 'PB'; // perfect bound
    }
  }

  // ---- Cover dimensions -----------------------------------------------

  async getCoverDimensions(packageId: string, pageCount: number): Promise<CoverDimensions> {
    const res = await this.authedFetch('/cover-dimensions/', {
      method: 'POST',
      // Lulu's cover-dimensions endpoint names this `interior_page_count`
      // (the print-job + cost-calc line items use `page_count`).
      body: JSON.stringify({
        pod_package_id: packageId,
        interior_page_count: pageCount,
        unit: 'pt',
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Lulu cover-dimensions failed (${res.status}): ${text}`);
      throw new ServiceUnavailableException(
        `cover-dimensions ${res.status}: ${text.slice(0, 400)}`,
      );
    }
    const data = (await res.json()) as {
      width: number;
      height: number;
      spine_size?: number;
    };
    return {
      widthPt: data.width,
      heightPt: data.height,
      spinePt: data.spine_size ?? 0,
      unit: 'pt',
    };
  }

  // ---- Cost ------------------------------------------------------------

  async calculateCost(
    spec: BookSpec,
    shippingAddress: BookShippingAddress,
    shippingLevel: string,
  ): Promise<CostBreakdown> {
    const res = await this.authedFetch('/print-job-cost-calculations/', {
      method: 'POST',
      body: JSON.stringify({
        line_items: [
          {
            page_count: spec.pageCount,
            pod_package_id: spec.packageId,
            quantity: spec.quantity,
          },
        ],
        shipping_address: this.toLuluAddress(shippingAddress),
        // Lulu's cost-calc + print-jobs endpoints both use `shipping_level`.
        shipping_level: shippingLevel,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Lulu cost-calc failed (${res.status}): ${text}`);
      throw new ServiceUnavailableException(
        `cost-calc ${res.status}: ${text.slice(0, 400)}`,
      );
    }
    const data = (await res.json()) as {
      currency: string;
      line_item_costs?: Array<{ total_cost_incl_tax: string }>;
      shipping_cost?: { total_cost_incl_tax: string };
      total_tax?: string;
      total_cost_incl_tax?: string;
    };

    const toCents = (s?: string) => Math.round(parseFloat(s || '0') * 100);
    const printCostCents = (data.line_item_costs || []).reduce(
      (sum, li) => sum + toCents(li.total_cost_incl_tax),
      0,
    );
    return {
      currency: data.currency || 'USD',
      printCostCents,
      shippingCents: toCents(data.shipping_cost?.total_cost_incl_tax),
      taxCents: toCents(data.total_tax),
      totalCents: toCents(data.total_cost_incl_tax),
    };
  }

  // ---- Print job -------------------------------------------------------

  async createPrintJob(input: CreatePrintJobInput): Promise<PrintJobResult> {
    const res = await this.authedFetch('/print-jobs/', {
      method: 'POST',
      body: JSON.stringify({
        contact_email: input.contactEmail,
        external_id: input.externalId,
        line_items: [
          {
            external_id: input.externalId,
            title: input.title,
            quantity: input.quantity,
            printable_normalization: {
              pod_package_id: input.packageId,
              cover: { source_url: input.coverPdfUrl },
              interior: { source_url: input.interiorPdfUrl },
            },
          },
        ],
        shipping_address: this.toLuluAddress(input.shippingAddress),
        shipping_level: input.shippingLevel,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Lulu print-job create failed (${res.status}): ${text}`);
      throw new ServiceUnavailableException('Could not submit the print job.');
    }
    const data = (await res.json()) as { id: number | string; status?: { name: string } };
    return { jobId: String(data.id), status: data.status?.name || 'CREATED' };
  }

  async getPrintJobStatus(jobId: string): Promise<PrintJobStatus> {
    const res = await this.authedFetch(`/print-jobs/${jobId}/`, { method: 'GET' });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Lulu print-job status failed (${res.status}): ${text}`);
      throw new ServiceUnavailableException('Could not fetch the print job status.');
    }
    const data = (await res.json()) as {
      id: number | string;
      status?: { name: string };
      tracking_urls?: string[];
    };
    return {
      jobId: String(data.id),
      status: data.status?.name || 'UNKNOWN',
      trackingUrl: data.tracking_urls?.[0],
    };
  }

  // ---- helpers ---------------------------------------------------------

  private toLuluAddress(a: BookShippingAddress) {
    return {
      name: a.name,
      street1: a.street1,
      street2: a.street2,
      city: a.city,
      state_code: a.state_code,
      postcode: a.postcode,
      country_code: a.country_code,
      phone_number: a.phone_number,
    };
  }
}
