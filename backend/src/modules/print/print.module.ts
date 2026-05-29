import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { LuluService } from './lulu.service';
import { PrintOrdersService } from './print-orders.service';
import { PrintController } from './print.controller';
import { PRINT_PROVIDER } from './print-provider.interface';
import { ExportModule } from '../export/export.module';
import { StorageModule } from '../storage/storage.module';

/**
 * Printing module — the print-on-demand integration.
 *
 * Exposes the print provider (Lulu) plus the order-pricing service +
 * controller. The Stripe charge, PDF hosting, and job submission will land
 * here too. Binding LuluService to the PRINT_PROVIDER token keeps
 * downstream code depending on the interface, not the vendor.
 */
@Module({
  imports: [ConfigModule, ExportModule, StorageModule],
  controllers: [PrintController],
  providers: [
    LuluService,
    PrintOrdersService,
    { provide: PRINT_PROVIDER, useExisting: LuluService },
  ],
  exports: [LuluService, PrintOrdersService, PRINT_PROVIDER],
})
export class PrintModule {}
