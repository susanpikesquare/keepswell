import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { PromptSelectionService } from './prompt-selection.service';
import { ClerkAuthGuard, Public } from '../../common/guards';

@Controller('templates')
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly promptSelectionService: PromptSelectionService,
  ) {}

  /**
   * Get all available templates
   * Public endpoint for template browsing
   */
  @Public()
  @Get()
  async getAllTemplates(@Query('premium') premium?: string) {
    const isPremium = premium === 'true';
    return this.templatesService.getTemplatesForTier(isPremium);
  }

  /**
   * Get a specific template by type
   */
  @Public()
  @Get('type/:type')
  async getTemplateByType(@Param('type') type: string) {
    return this.templatesService.getTemplateByType(type);
  }

  /**
   * Get prompts for a template
   */
  @Get(':templateId/prompts')
  async getTemplatePrompts(@Param('templateId') templateId: string) {
    return this.templatesService.getPromptsForTemplate(templateId);
  }

  /**
   * Get starter prompts for a template type
   */
  @Public()
  @Get('type/:type/starters')
  async getStarterPrompts(@Param('type') type: string) {
    return this.promptSelectionService.getStarterPrompts(type);
  }

  /**
   * Get prompts by category for a template type
   */
  @Get('type/:type/category/:category')
  async getPromptsByCategory(
    @Param('type') type: string,
    @Param('category') category: string,
  ) {
    return this.promptSelectionService.getPromptsByCategory(type, category);
  }

  /**
   * Get resolved configuration for a journal
   * Merges template defaults with journal customizations
   */
  @Get('journal/:journalId/config')
  async getJournalConfig(@Param('journalId') journalId: string) {
    return this.templatesService.getResolvedConfig(journalId);
  }

  /**
   * Select next prompt for a journal/participant
   */
  @Post('journal/:journalId/select-prompt')
  async selectPrompt(
    @Param('journalId') journalId: string,
    @Body()
    body: {
      participantId?: string;
      preferCategory?: string;
      excludePromptIds?: string[];
    },
  ) {
    return this.promptSelectionService.selectNextPrompt({
      journalId,
      participantId: body.participantId,
      preferCategory: body.preferCategory,
      excludePromptIds: body.excludePromptIds,
    });
  }

  /**
   * Log prompt usage
   */
  @Post('journal/:journalId/log-usage')
  async logPromptUsage(
    @Param('journalId') journalId: string,
    @Body()
    body: {
      promptId: string;
      participantId: string;
      category: string;
    },
  ) {
    return this.promptSelectionService.logPromptUsage(
      journalId,
      body.promptId,
      body.participantId,
      body.category,
    );
  }

  /**
   * Mark prompt as responded
   */
  @Post('journal/:journalId/mark-responded')
  async markResponded(
    @Param('journalId') journalId: string,
    @Body()
    body: {
      promptId: string;
      participantId: string;
      entryId: string;
    },
  ) {
    await this.promptSelectionService.markPromptResponded(
      journalId,
      body.promptId,
      body.participantId,
      body.entryId,
    );
    return { success: true };
  }

  /**
   * Get prompt usage statistics for a journal
   */
  @Get('journal/:journalId/stats')
  async getUsageStats(@Param('journalId') journalId: string) {
    return this.promptSelectionService.getUsageStats(journalId);
  }

  /**
   * Update journal customizations
   */
  @Patch('journal/:journalId/customize')
  async updateCustomizations(
    @Param('journalId') journalId: string,
    @Body()
    body: {
      visualRules?: Record<string, unknown>;
      framingRules?: Record<string, unknown>;
      cadenceConfig?: Record<string, unknown>;
    },
  ) {
    return this.templatesService.updateJournalCustomizations(journalId, body);
  }
}
