import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SubscriptionService } from './subscription.service';
import { User, Journal, Participant } from '../../database/entities';
import stripeConfig from '../../config/stripe.config';
import { SmsModule } from '../sms/sms.module';
import { PrintModule } from '../print/print.module';

@Module({
  imports: [
    ConfigModule.forFeature(stripeConfig),
    TypeOrmModule.forFeature([User, Journal, Participant]),
    SmsModule,
    // Book-order checkout: payments routes `book_order` webhook events to
    // PrintOrdersService, which in turn asks us to create the Stripe
    // session. forwardRef breaks the circular import.
    forwardRef(() => PrintModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionService],
  exports: [PaymentsService, SubscriptionService],
})
export class PaymentsModule {}
