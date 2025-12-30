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
}
