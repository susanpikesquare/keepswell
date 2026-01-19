import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  JournalTemplate,
  Prompt,
  Journal,
  VisualRulesConfig,
  FramingRulesConfig,
  StructuralRulesConfig,
  CadenceConfigData,
} from '../../database/entities';

/**
 * Merged template configuration with journal customizations applied
 */
export interface ResolvedTemplateConfig {
  templateId: string;
  templateType: string;
  visualRules: VisualRulesConfig;
  framingRules: FramingRulesConfig;
  structuralRules: StructuralRulesConfig;
  cadenceConfig: CadenceConfigData;
  suggestedRelationships: string[];
  isPremium: boolean;
}

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(JournalTemplate)
    private templateRepository: Repository<JournalTemplate>,
    @InjectRepository(Prompt)
    private promptRepository: Repository<Prompt>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
  ) {}

  /**
   * Get all available templates
   */
  async getAllTemplates(): Promise<JournalTemplate[]> {
    return this.templateRepository.find({
      where: { is_system_template: true },
      order: { type: 'ASC' },
    });
  }

  /**
   * Get templates available for a user's tier
   */
  async getTemplatesForTier(isPremium: boolean): Promise<JournalTemplate[]> {
    const templates = await this.getAllTemplates();
    if (isPremium) {
      return templates;
    }
    return templates.filter((t) => !t.is_premium);
  }

  /**
   * Get a template by type
   */
  async getTemplateByType(type: string): Promise<JournalTemplate | null> {
    return this.templateRepository.findOne({
      where: { type, is_system_template: true },
    });
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(id: string): Promise<JournalTemplate | null> {
    return this.templateRepository.findOne({
      where: { id },
    });
  }

  /**
   * Get all prompts for a template
   */
  async getPromptsForTemplate(templateId: string): Promise<Prompt[]> {
    return this.promptRepository.find({
      where: { template_id: templateId },
      order: { sequence_order: 'ASC', weight: 'DESC' },
    });
  }

  /**
   * Get the resolved template configuration for a journal
   * This merges template defaults with journal-specific customizations
   */
  async getResolvedConfig(journalId: string): Promise<ResolvedTemplateConfig> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Get the base template
    const template = await this.getTemplateByType(journal.template_type);

    if (!template) {
      throw new NotFoundException(
        `Template not found for type: ${journal.template_type}`,
      );
    }

    // Merge template defaults with journal customizations
    const visualRules = this.mergeConfig<VisualRulesConfig>(
      template.visual_rules,
      journal.custom_visual_rules,
    );

    const framingRules = this.mergeConfig<FramingRulesConfig>(
      template.framing_rules,
      journal.custom_framing_rules,
    );

    const cadenceConfig = this.mergeConfig<CadenceConfigData>(
      template.cadence_config,
      journal.custom_cadence_config,
    );

    return {
      templateId: template.id,
      templateType: template.type,
      visualRules,
      framingRules,
      structuralRules: template.structural_rules,
      cadenceConfig,
      suggestedRelationships: template.suggested_relationships || [],
      isPremium: template.is_premium,
    };
  }

  /**
   * Update journal customizations
   */
  async updateJournalCustomizations(
    journalId: string,
    customizations: {
      visualRules?: Partial<VisualRulesConfig>;
      framingRules?: Partial<FramingRulesConfig>;
      cadenceConfig?: Partial<CadenceConfigData>;
    },
  ): Promise<Journal> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    if (customizations.visualRules) {
      journal.custom_visual_rules = this.deepMerge(
        journal.custom_visual_rules || {},
        customizations.visualRules,
      ) as Partial<VisualRulesConfig>;
    }

    if (customizations.framingRules) {
      journal.custom_framing_rules = this.deepMerge(
        journal.custom_framing_rules || {},
        customizations.framingRules,
      ) as Partial<FramingRulesConfig>;
    }

    if (customizations.cadenceConfig) {
      journal.custom_cadence_config = this.deepMerge(
        journal.custom_cadence_config || {},
        customizations.cadenceConfig,
      ) as Partial<CadenceConfigData>;
    }

    return this.journalRepository.save(journal);
  }

  /**
   * Merge configuration with type safety
   */
  private mergeConfig<T>(base: T | null | undefined, overrides: Partial<T> | null | undefined): T {
    if (!base) {
      return (overrides || {}) as T;
    }
    if (!overrides) {
      return base;
    }
    return this.deepMerge(base as object, overrides as object) as T;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge(target: object, source: object): object {
    const output = { ...target } as Record<string, unknown>;
    const sourceRecord = source as Record<string, unknown>;
    const targetRecord = target as Record<string, unknown>;

    for (const key of Object.keys(sourceRecord)) {
      if (
        sourceRecord[key] &&
        typeof sourceRecord[key] === 'object' &&
        !Array.isArray(sourceRecord[key])
      ) {
        if (targetRecord[key] && typeof targetRecord[key] === 'object') {
          output[key] = this.deepMerge(
            targetRecord[key] as object,
            sourceRecord[key] as object,
          );
        } else {
          output[key] = sourceRecord[key];
        }
      } else if (sourceRecord[key] !== undefined) {
        output[key] = sourceRecord[key];
      }
    }

    return output;
  }

  /**
   * Create a new custom template (for enterprise users)
   */
  async createCustomTemplate(
    userId: string,
    data: Partial<JournalTemplate>,
  ): Promise<JournalTemplate> {
    const template = this.templateRepository.create({
      ...data,
      type: 'custom',
      is_system_template: false,
      is_premium: false,
      created_by: userId,
    });

    return this.templateRepository.save(template);
  }

  /**
   * Get prompts for a specific journal with custom ordering applied
   * Includes both template prompts and journal-specific custom prompts
   */
  async getPromptsForJournal(journalId: string): Promise<Prompt[]> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Get the template for this journal
    const template = await this.getTemplateByType(journal.template_type);
    if (!template) {
      throw new NotFoundException(`Template not found for type: ${journal.template_type}`);
    }

    // Get all prompts for the template
    const templatePrompts = await this.getPromptsForTemplate(template.id);

    // Get journal-specific custom prompts
    const customPrompts = await this.promptRepository.find({
      where: { journal_id: journalId },
      order: { sequence_order: 'ASC' },
    });

    // Combine them
    const allPrompts = [...templatePrompts, ...customPrompts];

    // Apply custom ordering if exists
    const customOrder = journal.custom_cadence_config?.customPromptOrder;
    if (customOrder && customOrder.length > 0) {
      return this.applyCustomOrder(allPrompts, customOrder);
    }

    return allPrompts;
  }

  /**
   * Update custom prompt order for a journal
   */
  async updatePromptOrder(journalId: string, promptIds: string[]): Promise<Journal> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Store the custom prompt order in cadence config
    const currentConfig = journal.custom_cadence_config || {};
    journal.custom_cadence_config = {
      ...currentConfig,
      customPromptOrder: promptIds,
    } as Partial<CadenceConfigData>;

    return this.journalRepository.save(journal);
  }

  /**
   * Reset prompt order to default for a journal
   */
  async resetPromptOrder(journalId: string): Promise<Journal> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Remove custom prompt order from cadence config
    const currentConfig = journal.custom_cadence_config || {};
    const { customPromptOrder, ...restConfig } = currentConfig as CadenceConfigData & { customPromptOrder?: string[] };
    journal.custom_cadence_config = restConfig as Partial<CadenceConfigData>;

    return this.journalRepository.save(journal);
  }

  /**
   * Apply custom order to prompts array
   */
  private applyCustomOrder(prompts: Prompt[], customOrder: string[]): Prompt[] {
    const promptMap = new Map(prompts.map(p => [p.id, p]));
    const ordered: Prompt[] = [];

    // Add prompts in custom order
    for (const id of customOrder) {
      const prompt = promptMap.get(id);
      if (prompt) {
        ordered.push(prompt);
        promptMap.delete(id);
      }
    }

    // Add any remaining prompts not in custom order (new prompts)
    for (const prompt of promptMap.values()) {
      ordered.push(prompt);
    }

    return ordered;
  }

  /**
   * Create a custom prompt for a specific journal
   */
  async createJournalPrompt(
    journalId: string,
    data: {
      text: string;
      category?: string;
      is_starter?: boolean;
      is_deep?: boolean;
      requires_photo?: boolean;
    },
  ): Promise<Prompt> {
    const journal = await this.journalRepository.findOne({
      where: { id: journalId },
    });

    if (!journal) {
      throw new NotFoundException('Journal not found');
    }

    // Get the template to get the max sequence order
    const template = await this.getTemplateByType(journal.template_type);
    const existingPrompts = await this.getPromptsForJournal(journalId);
    const maxSequenceOrder = existingPrompts.length > 0
      ? Math.max(...existingPrompts.map(p => p.sequence_order || 0))
      : 0;

    const prompt = this.promptRepository.create({
      journal_id: journalId,
      text: data.text,
      category: data.category || 'custom',
      is_starter: data.is_starter || false,
      is_deep: data.is_deep || false,
      requires_photo: data.requires_photo || false,
      is_custom: true,
      weight: 5,
      sequence_order: maxSequenceOrder + 1,
    });

    return this.promptRepository.save(prompt);
  }

  /**
   * Update a prompt (only custom prompts can be fully edited)
   */
  async updatePrompt(
    promptId: string,
    journalId: string,
    data: {
      text?: string;
      category?: string;
      is_starter?: boolean;
      is_deep?: boolean;
      requires_photo?: boolean;
    },
  ): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // Only allow editing custom prompts that belong to this journal
    if (prompt.journal_id !== journalId) {
      throw new NotFoundException('Prompt not found for this journal');
    }

    // Update fields
    if (data.text !== undefined) prompt.text = data.text;
    if (data.category !== undefined) prompt.category = data.category;
    if (data.is_starter !== undefined) prompt.is_starter = data.is_starter;
    if (data.is_deep !== undefined) prompt.is_deep = data.is_deep;
    if (data.requires_photo !== undefined) prompt.requires_photo = data.requires_photo;

    return this.promptRepository.save(prompt);
  }

  /**
   * Delete a custom prompt
   */
  async deletePrompt(promptId: string, journalId: string): Promise<void> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
    });

    if (!prompt) {
      throw new NotFoundException('Prompt not found');
    }

    // Only allow deleting custom prompts that belong to this journal
    if (prompt.journal_id !== journalId) {
      throw new NotFoundException('Prompt not found for this journal');
    }

    await this.promptRepository.remove(prompt);
  }
}
