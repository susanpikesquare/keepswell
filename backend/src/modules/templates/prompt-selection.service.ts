import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import {
  Prompt,
  JournalTemplate,
  Journal,
  PromptUsageLog,
  Participant,
  CategoryWeights,
  RotationSettings,
} from '../../database/entities';

/**
 * Context for prompt selection
 */
export interface PromptSelectionContext {
  journalId: string;
  participantId?: string;
  currentDate?: Date;
  excludePromptIds?: string[];
  preferCategory?: string;
  isNewParticipant?: boolean;
}

/**
 * Result of prompt selection
 */
export interface SelectedPrompt {
  prompt: Prompt;
  selectionReason: string;
  confidence: number;
}

@Injectable()
export class PromptSelectionService {
  constructor(
    @InjectRepository(Prompt)
    private promptRepository: Repository<Prompt>,
    @InjectRepository(JournalTemplate)
    private templateRepository: Repository<JournalTemplate>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(PromptUsageLog)
    private usageLogRepository: Repository<PromptUsageLog>,
    @InjectRepository(Participant)
    private participantRepository: Repository<Participant>,
  ) {}

  /**
   * Select the next prompt to send for a journal/participant
   * Uses weighted random selection with rotation logic
   */
  async selectNextPrompt(
    context: PromptSelectionContext,
  ): Promise<SelectedPrompt> {
    const { journalId, participantId, currentDate = new Date() } = context;

    // Get journal and template
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    const template = await this.templateRepository.findOne({
      where: { type: journal.template_type, is_system_template: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Get all prompts for this template
    const allPrompts = await this.promptRepository.find({
      where: { template_id: template.id },
    });

    if (allPrompts.length === 0) {
      throw new NotFoundException('No prompts available for this template');
    }

    // Get participant info if provided
    let participant: Participant | null = null;
    let participantResponseCount = 0;

    if (participantId) {
      participant = await this.participantRepository.findOne({
        where: { id: participantId },
      });

      if (participant) {
        participantResponseCount = await this.usageLogRepository.count({
          where: {
            journal_id: journalId,
            participant_id: participantId,
            responded_at: MoreThan(new Date(0)),
          },
        });
      }
    }

    // Get recent usage to avoid repetition
    const rotationSettings = template.rotation_settings || {
      avoidRepeatDays: 30,
      avoidCategoryRepeat: 2,
      prioritizeUnused: true,
    };

    const recentUsage = await this.getRecentUsage(
      journalId,
      participantId,
      rotationSettings.avoidRepeatDays,
    );

    const recentCategories = await this.getRecentCategories(
      journalId,
      rotationSettings.avoidCategoryRepeat,
    );

    // Filter and score prompts
    const scoredPrompts = this.scorePrompts(allPrompts, {
      recentUsedPromptIds: recentUsage.map((u) => u.prompt_id),
      recentCategories,
      categoryWeights: template.category_weights,
      rotationSettings,
      participant,
      participantResponseCount,
      currentDate,
      isNewParticipant: context.isNewParticipant || participantResponseCount === 0,
      excludePromptIds: context.excludePromptIds || [],
      preferCategory: context.preferCategory,
    });

    // Select using weighted random
    const selectedPrompt = this.weightedRandomSelect(scoredPrompts);

    return {
      prompt: selectedPrompt.prompt,
      selectionReason: selectedPrompt.reason,
      confidence: selectedPrompt.score / 100,
    };
  }

  /**
   * Get recent prompt usage for a journal
   */
  private async getRecentUsage(
    journalId: string,
    participantId: string | undefined,
    days: number,
  ): Promise<PromptUsageLog[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const where: Record<string, unknown> = {
      journal_id: journalId,
      sent_at: MoreThan(cutoffDate),
    };

    if (participantId) {
      where.participant_id = participantId;
    }

    return this.usageLogRepository.find({ where });
  }

  /**
   * Get recently used categories
   */
  private async getRecentCategories(
    journalId: string,
    count: number,
  ): Promise<string[]> {
    const recentLogs = await this.usageLogRepository.find({
      where: { journal_id: journalId },
      order: { sent_at: 'DESC' },
      take: count,
    });

    return recentLogs.map((log) => log.category).filter(Boolean) as string[];
  }

  /**
   * Score prompts based on various factors
   */
  private scorePrompts(
    prompts: Prompt[],
    context: {
      recentUsedPromptIds: string[];
      recentCategories: string[];
      categoryWeights: CategoryWeights | null;
      rotationSettings: RotationSettings;
      participant: Participant | null;
      participantResponseCount: number;
      currentDate: Date;
      isNewParticipant: boolean;
      excludePromptIds: string[];
      preferCategory?: string;
    },
  ): Array<{ prompt: Prompt; score: number; reason: string }> {
    const scored: Array<{ prompt: Prompt; score: number; reason: string }> = [];

    for (const prompt of prompts) {
      // Skip excluded prompts
      if (context.excludePromptIds.includes(prompt.id)) {
        continue;
      }

      // Skip recently used prompts
      if (context.recentUsedPromptIds.includes(prompt.id)) {
        continue;
      }

      let score = prompt.weight * 10; // Base score from weight (1-10 -> 10-100)
      let reason = 'base_weight';

      // Boost starter prompts for new participants
      if (context.isNewParticipant && prompt.is_starter) {
        score += 50;
        reason = 'starter_for_new_participant';
      }

      // Penalize recently used categories
      if (context.recentCategories.includes(prompt.category)) {
        score -= 30;
      }

      // Apply category weights from template
      if (context.categoryWeights && prompt.category) {
        const categoryWeight =
          context.categoryWeights[prompt.category as keyof CategoryWeights] || 0;
        score += categoryWeight * 2;
      }

      // Boost preferred category
      if (context.preferCategory && prompt.category === context.preferCategory) {
        score += 40;
        reason = 'preferred_category';
      }

      // Check seasonality
      if (prompt.seasonality) {
        const isSeasonalMatch = this.checkSeasonality(
          prompt.seasonality,
          context.currentDate,
        );
        if (!isSeasonalMatch) {
          continue; // Skip non-matching seasonal prompts
        }
        score += 20;
        reason = 'seasonal_match';
      }

      // Check targeting rules
      if (prompt.targeting && context.participant) {
        const targetingMatch = this.checkTargeting(
          prompt.targeting,
          context.participant,
          context.participantResponseCount,
        );
        if (!targetingMatch) {
          continue; // Skip non-matching targeted prompts
        }
        score += 15;
      }

      // Penalize deep prompts for new participants
      if (prompt.is_deep && context.participantResponseCount < 3) {
        score -= 40;
      }

      // Boost unused prompts if configured
      if (context.rotationSettings.prioritizeUnused && prompt.usage_count === 0) {
        score += 25;
        reason = 'never_used';
      }

      // Ensure minimum score
      score = Math.max(score, 1);

      scored.push({ prompt, score, reason });
    }

    return scored;
  }

  /**
   * Check if prompt matches current seasonality
   */
  private checkSeasonality(
    seasonality: Prompt['seasonality'],
    currentDate: Date,
  ): boolean {
    if (!seasonality) return true;

    const month = currentDate.getMonth() + 1; // 1-12
    const dayOfWeek = currentDate.getDay(); // 0-6

    if (seasonality.months && !seasonality.months.includes(month)) {
      return false;
    }

    if (seasonality.daysOfWeek && !seasonality.daysOfWeek.includes(dayOfWeek)) {
      return false;
    }

    // TODO: Add holiday detection
    if (seasonality.holidays) {
      // For now, skip holiday check - would need a holiday calendar
    }

    return true;
  }

  /**
   * Check if prompt matches participant targeting
   */
  private checkTargeting(
    targeting: Prompt['targeting'],
    participant: Participant,
    responseCount: number,
  ): boolean {
    if (!targeting) return true;

    if (
      targeting.relationships &&
      participant.relationship &&
      !targeting.relationships.includes(participant.relationship)
    ) {
      return false;
    }

    if (targeting.minResponses && responseCount < targeting.minResponses) {
      return false;
    }

    if (targeting.maxResponses && responseCount >= targeting.maxResponses) {
      return false;
    }

    return true;
  }

  /**
   * Select a prompt using weighted random selection
   */
  private weightedRandomSelect(
    scored: Array<{ prompt: Prompt; score: number; reason: string }>,
  ): { prompt: Prompt; score: number; reason: string } {
    if (scored.length === 0) {
      throw new NotFoundException('No eligible prompts available');
    }

    const totalScore = scored.reduce((sum, item) => sum + item.score, 0);
    let random = Math.random() * totalScore;

    for (const item of scored) {
      random -= item.score;
      if (random <= 0) {
        return item;
      }
    }

    // Fallback to first item
    return scored[0];
  }

  /**
   * Log prompt usage
   */
  async logPromptUsage(
    journalId: string,
    promptId: string,
    participantId: string,
    category: string,
  ): Promise<PromptUsageLog> {
    const log = this.usageLogRepository.create({
      journal_id: journalId,
      prompt_id: promptId,
      participant_id: participantId,
      category,
      sent_at: new Date(),
    });

    // Increment prompt usage count
    await this.promptRepository.increment({ id: promptId }, 'usage_count', 1);

    return this.usageLogRepository.save(log);
  }

  /**
   * Mark prompt as responded
   */
  async markPromptResponded(
    journalId: string,
    promptId: string,
    participantId: string,
    entryId: string,
  ): Promise<void> {
    await this.usageLogRepository.update(
      {
        journal_id: journalId,
        prompt_id: promptId,
        participant_id: participantId,
      },
      {
        responded_at: new Date(),
        response_entry_id: entryId,
      },
    );
  }

  /**
   * Get prompts by category for a template
   */
  async getPromptsByCategory(
    templateType: string,
    category: string,
  ): Promise<Prompt[]> {
    const template = await this.templateRepository.findOne({
      where: { type: templateType, is_system_template: true },
    });

    if (!template) {
      return [];
    }

    return this.promptRepository.find({
      where: {
        template_id: template.id,
        category,
      },
      order: { weight: 'DESC' },
    });
  }

  /**
   * Get starter prompts for a template
   */
  async getStarterPrompts(templateType: string): Promise<Prompt[]> {
    const template = await this.templateRepository.findOne({
      where: { type: templateType, is_system_template: true },
    });

    if (!template) {
      return [];
    }

    return this.promptRepository.find({
      where: {
        template_id: template.id,
        is_starter: true,
      },
      order: { weight: 'DESC' },
    });
  }

  /**
   * Get prompt usage statistics for a journal
   */
  async getUsageStats(journalId: string): Promise<{
    totalSent: number;
    totalResponded: number;
    responseRate: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const logs = await this.usageLogRepository.find({
      where: { journal_id: journalId },
    });

    const totalSent = logs.length;
    const totalResponded = logs.filter((l) => l.responded_at).length;
    const responseRate = totalSent > 0 ? totalResponded / totalSent : 0;

    const categoryBreakdown: Record<string, number> = {};
    for (const log of logs) {
      if (log.category) {
        categoryBreakdown[log.category] =
          (categoryBreakdown[log.category] || 0) + 1;
      }
    }

    return {
      totalSent,
      totalResponded,
      responseRate,
      categoryBreakdown,
    };
  }
}
