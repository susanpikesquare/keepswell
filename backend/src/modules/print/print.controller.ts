import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { BookShippingAddress } from '../../database/entities';
import { LuluService } from './lulu.service';
import { PrintOrdersService } from './print-orders.service';

interface EstimateBody {
  journalId: string;
  trimSize?: string;
  binding?: string;
  quantity?: number;
  shippingAddress: BookShippingAddress;
  shippingLevel?: string;
}

@Controller('print')
@UseGuards(ClerkAuthGuard)
export class PrintController {
  constructor(
    private readonly printOrders: PrintOrdersService,
    private readonly lulu: LuluService,
  ) {}

  /**
   * Public health/config probe. Returns whether printing is configured and
   * whether the (sandbox) credentials actually authenticate — so we can
   * verify the keys without placing an order. Reveals only booleans, no
   * secrets. The token is cached, so repeated hits don't spam Lulu.
   */
  @Public()
  @Get('status')
  async status() {
    const configured = this.lulu.isConfigured();
    const auth = configured ? await this.lulu.pingAuth() : { ok: false, error: 'not_configured' };
    return { configured, authOk: auth.ok, authError: auth.error };
  }

  /**
   * Public diagnostic: resolve our default package id and ask Lulu for its
   * cover dimensions at a sample page count. Confirms our pod_package_id
   * encoding maps to a real Lulu product (Lulu 400s on an unknown id) —
   * the single biggest unknown — without needing a journal or login. No
   * order, no charge. Returns only the package id + dimensions or the error.
   */
  @Public()
  @Get('probe')
  async probe() {
    const samplePages = 100;
    const packages = [
      { trimSize: '8x10', binding: 'perfect' as const },
      { trimSize: '6x9', binding: 'perfect' as const },
      { trimSize: '8.5x11', binding: 'perfect' as const },
    ];
    const results = [];
    for (const p of packages) {
      const packageId = this.lulu.resolvePackageId({ ...p, color: true });
      try {
        const dims = await this.lulu.getCoverDimensions(packageId, samplePages);
        results.push({ ...p, packageId, ok: true, dims });
      } catch (e) {
        results.push({ ...p, packageId, ok: false, error: (e as Error).message });
      }
    }
    return { samplePages, results };
  }

  /**
   * Quote the customer-facing price to print a journal as a book.
   * No charge, no print — just renders the interior to count pages and
   * asks Lulu (sandbox) for the cost, then applies our markup.
   */
  @Post('estimate')
  async estimate(@CurrentUser() auth: AuthUser, @Body() body: EstimateBody) {
    return this.printOrders.estimate(auth.clerkId, {
      journalId: body.journalId,
      trimSize: body.trimSize || '8x10',
      binding: body.binding || 'perfect',
      quantity: body.quantity && body.quantity > 0 ? body.quantity : 1,
      shippingAddress: body.shippingAddress,
      shippingLevel: body.shippingLevel || 'MAIL',
    });
  }

  /**
   * Render + host the interior PDF and resolve the cover dimensions for a
   * journal. De-risking step before cover generation + job submission; no
   * charge, no print job. Returns the hosted interior URL, page count, the
   * resolved pod_package_id, and the exact cover size Lulu expects.
   */
  @Post('prepare')
  async prepare(
    @CurrentUser() auth: AuthUser,
    @Body() body: { journalId: string; trimSize?: string; binding?: string },
  ) {
    return this.printOrders.prepare(auth.clerkId, {
      journalId: body.journalId,
      trimSize: body.trimSize || '8x10',
      binding: body.binding || 'perfect',
    });
  }
}
