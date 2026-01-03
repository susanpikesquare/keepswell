import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalsController } from './journals.controller';
import { JournalsService } from './journals.service';
import { Journal, User, Entry, Participant } from '../../database/entities';
import { SmsModule } from '../sms/sms.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Journal, User, Entry, Participant]),
    forwardRef(() => SmsModule),
    PaymentsModule,
  ],
  controllers: [JournalsController],
  providers: [JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
