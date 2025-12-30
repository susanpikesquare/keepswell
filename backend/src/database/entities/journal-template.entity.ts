import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Prompt } from './prompt.entity';

/**
 * Visual rules for timeline appearance
 */
export interface VisualRulesConfig {
  photo: {
    emphasis: 'photo' | 'text' | 'balanced';
    defaultAspectRatio: '1:1' | '4:3' | '16:9' | 'original';
    gridLayout: 'single' | 'masonry' | 'carousel';
    showCaptions: boolean;
    frameStyle: 'none' | 'polaroid' | 'rounded' | 'shadow';
  };
  text: {
    quoteStyle: 'italic' | 'serif' | 'handwritten' | 'clean';
    showAttribution: boolean;
    maxPreviewLength: number;
    highlightFirstEntry: boolean;
  };
  timeline: {
    groupBy: 'day' | 'week' | 'month' | 'chapter';
    showDateHeaders: boolean;
    showParticipantAvatars: boolean;
    animationStyle: 'fade' | 'slide' | 'none';
  };
  colors: {
    primary: string;
    accent: string;
    background: string;
    cardBackground: string;
    text: string;
    muted: string;
  };
  decorations: {
    icon: string;
    pattern?: string;
    showMoodIndicators: boolean;
    showReactionEmojis: boolean;
  };
}

/**
 * Entry framing and presentation rules
 */
export interface FramingRulesConfig {
  headlines: {
    showPromptAsHeadline: boolean;
    generateHeadline: boolean;
    headlineStyle: 'question' | 'statement' | 'date' | 'participant';
  };
  badges: {
    showCategory: boolean;
    showMilestones: boolean;
    showStreak: boolean;
    customBadges: Array<{
      id: string;
      name: string;
      icon: string;
      description: string;
      triggerCondition: {
        type: 'entry_count' | 'streak' | 'category' | 'first' | 'custom';
        value: number | string;
      };
    }>;
  };
  attribution: {
    format: 'name' | 'relationship' | 'both' | 'anonymous';
    showTimestamp: boolean;
    timestampFormat: 'relative' | 'absolute' | 'friendly';
  };
  language: {
    entryNoun: string;
    collectionNoun: string;
    participantNoun: string;
    actionVerb: string;
  };
}

/**
 * Structural organization rules
 */
export interface StructuralRulesConfig {
  chapters: {
    enabled: boolean;
    trigger: 'date_milestone' | 'entry_count' | 'participant_first' | 'media_heavy' | 'topic_shift';
    triggerValue: number | string;
    naming: 'auto' | 'date' | 'numbered' | 'custom';
    showChapterSummary: boolean;
  };
  recaps: {
    enabled: boolean;
    frequency: 'weekly' | 'monthly' | 'quarterly';
    includeHighlights: boolean;
    includeStats: boolean;
    deliveryMethod: 'in_app' | 'email' | 'both';
  };
  specialSections: {
    pinnedAtTop: boolean;
    highlightsSection: boolean;
    yearInReview: boolean;
  };
  density: {
    entriesPerPage: number;
    lazyLoadThreshold: number;
    showLoadMore: boolean;
  };
}

/**
 * Export configuration for books/PDFs
 */
export interface ExportConfigData {
  book: {
    pageSize: 'letter' | 'a4' | '6x9' | '8x10';
    orientation: 'portrait' | 'landscape';
    includeTableOfContents: boolean;
    includeCoverPage: boolean;
    includeParticipantIndex: boolean;
  };
  content: {
    includeHidden: boolean;
    includePrompts: boolean;
    photoQuality: 'web' | 'print' | 'original';
    maxPhotosPerEntry: number;
  };
  styling: {
    fontFamily: string;
    fontSize: number;
    margins: { top: number; bottom: number; left: number; right: number };
    headerStyle: 'minimal' | 'decorative' | 'none';
    pageNumbers: boolean;
  };
  premium: {
    aiNarrative: boolean;
    professionalLayout: boolean;
    hardcoverReady: boolean;
  };
}

/**
 * Cadence and scheduling configuration
 */
export interface CadenceConfigData {
  defaultFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  defaultDayOfWeek: number | null;
  defaultTime: string;
  defaultTimezone: string;
  adaptive: {
    enabled: boolean;
    minResponseRate: number;
    maxResponseRate: number;
    respectQuietHours: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  special: {
    birthdayPrompts: boolean;
    anniversaryPrompts: boolean;
    holidayPrompts: boolean;
  };
  participantRules: {
    newParticipantBurst: boolean;
    burstDuration: number;
    burstFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
    inactiveReminder: boolean;
    inactiveThresholdDays: number;
  };
}

/**
 * AI feature configuration
 */
export interface AIConfigData {
  features: {
    adaptivePrompts: boolean;
    smartScheduling: boolean;
    chapterSuggestions: boolean;
    highlightCuration: boolean;
    narrativeGeneration: boolean;
    sentimentAnalysis: boolean;
    topicClustering: boolean;
  };
  promptGeneration: {
    enabled: boolean;
    contextWindowEntries: number;
    personalizePerParticipant: boolean;
    avoidTopics: string[];
    encourageTopics: string[];
  };
  analysis: {
    extractKeyMoments: boolean;
    trackThemes: boolean;
    suggestFollowUps: boolean;
  };
  narrative: {
    generateChapterIntros: boolean;
    generateYearInReview: boolean;
    writingStyle: 'journalistic' | 'storytelling' | 'poetic' | 'casual';
    preserveVoice: boolean;
  };
  privacy: {
    aiProcessingConsent: boolean;
    dataRetentionDays: number;
    excludeParticipants: string[];
  };
}

/**
 * Prompt pack category weights
 */
export interface CategoryWeights {
  memories: number;
  gratitude: number;
  milestones: number;
  traditions: number;
  wisdom: number;
  stories: number;
  dreams: number;
  daily: number;
  reflection: number;
  adventure: number;
}

/**
 * Prompt rotation settings
 */
export interface RotationSettings {
  avoidRepeatDays: number;
  avoidCategoryRepeat: number;
  prioritizeUnused: boolean;
}

@Entity('journal_templates')
export class JournalTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  type: string; // 'family', 'friends', 'romantic', 'vacation', 'custom'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  tagline: string;

  @Column({ default: true })
  is_system_template: boolean;

  @Column({ default: false })
  is_premium: boolean;

  // Visual configuration
  @Column({ type: 'jsonb', nullable: true })
  visual_rules: VisualRulesConfig;

  // Entry framing configuration
  @Column({ type: 'jsonb', nullable: true })
  framing_rules: FramingRulesConfig;

  // Structural configuration
  @Column({ type: 'jsonb', nullable: true })
  structural_rules: StructuralRulesConfig;

  // Export configuration
  @Column({ type: 'jsonb', nullable: true })
  export_config: ExportConfigData;

  // Cadence configuration
  @Column({ type: 'jsonb', nullable: true })
  cadence_config: CadenceConfigData;

  // AI configuration
  @Column({ type: 'jsonb', nullable: true })
  ai_config: AIConfigData;

  // Prompt pack settings
  @Column({ type: 'jsonb', nullable: true })
  category_weights: CategoryWeights;

  @Column({ type: 'jsonb', nullable: true })
  rotation_settings: RotationSettings;

  // Suggested relationships for this template
  @Column({ type: 'jsonb', nullable: true })
  suggested_relationships: string[];

  // Preview image for template selection
  @Column({ nullable: true })
  preview_image_url: string;

  // Version tracking
  @Column({ default: '1.0.0' })
  version: string;

  @Column({ nullable: true })
  created_by: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Prompt, (prompt) => prompt.template)
  prompts: Prompt[];
}
