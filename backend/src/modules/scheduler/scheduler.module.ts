import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Journal,
  Participant,
  ScheduledPrompt,
  PromptSend,
  Prompt,
  User,
} from '../../database/entities';
import { SchedulerService } from './scheduler.service';
import { PromptsController } from './prompts.controller';
import { SmsModule } from '../sms/sms.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Journal,
      Participant,
      ScheduledPrompt,
      PromptSend,
      Prompt,
      User,
    ]),
    SmsModule,
    TemplatesModule,
    NotificationsModule,
    AuthModule,
  ],
  controllers: [PromptsController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
