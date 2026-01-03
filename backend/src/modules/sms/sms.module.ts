import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsService } from './sms.service';
import { SmsLimitsService } from './sms-limits.service';
import { SmsController } from './sms.controller';
import { Entry, Participant, MediaAttachment, Journal, PromptSend, PendingMemory, User } from '../../database/entities';
import { StorageModule } from '../storage/storage.module';
import { JournalsModule } from '../journals/journals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entry, Participant, MediaAttachment, Journal, PromptSend, PendingMemory, User]),
    StorageModule,
    forwardRef(() => JournalsModule),
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsLimitsService],
  exports: [SmsService, SmsLimitsService],
})
export class SmsModule {}
