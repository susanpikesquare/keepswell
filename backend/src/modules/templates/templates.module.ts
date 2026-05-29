import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  JournalTemplate,
  Prompt,
  Journal,
  PromptUsageLog,
  AIContent,
  Participant,
  User,
} from '../../database/entities';
import { TemplatesService } from './templates.service';
import { PromptSelectionService } from './prompt-selection.service';
import { TemplatesController } from './templates.controller';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JournalTemplate,
      Prompt,
      Journal,
      PromptUsageLog,
      AIContent,
      Participant,
      User,
    ]),
    PaymentsModule,
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, PromptSelectionService],
  exports: [TemplatesService, PromptSelectionService],
})
export class TemplatesModule {}
