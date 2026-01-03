import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SubscriptionService } from './subscription.service';
import { User, Journal, Participant } from '../../database/entities';
import stripeConfig from '../../config/stripe.config';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    ConfigModule.forFeature(stripeConfig),
    TypeOrmModule.forFeature([User, Journal, Participant]),
    SmsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionService],
  exports: [PaymentsService, SubscriptionService],
})
export class PaymentsModule {}
