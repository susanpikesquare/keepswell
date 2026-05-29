import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LuluService } from './lulu.service';
import { PRINT_PROVIDER } from './print-provider.interface';

/**
 * Printing module — the print-on-demand integration.
 *
 * For now it just exposes the print provider (Lulu). The order flow,
 * Stripe charge, and PDF assembly will live here too once we can test the
 * provider against the Lulu sandbox. Binding LuluService to the
 * PRINT_PROVIDER token keeps downstream code depending on the interface,
 * not the vendor.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    LuluService,
    { provide: PRINT_PROVIDER, useExisting: LuluService },
  ],
  exports: [LuluService, PRINT_PROVIDER],
})
export class PrintModule {}
