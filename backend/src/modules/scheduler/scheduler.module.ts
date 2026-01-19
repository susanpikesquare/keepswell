import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Journal,
  Participant,
  ScheduledPrompt,
  PromptSend,
  Prompt,
} from '../../database/entities';
import { SchedulerService } from './scheduler.service';
import { SmsModule } from '../sms/sms.module';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Journal,
      Participant,
      ScheduledPrompt,
      PromptSend,
      Prompt,
    ]),
    SmsModule,
    TemplatesModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
