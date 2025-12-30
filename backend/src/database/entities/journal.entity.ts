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
import { Participant } from './participant.entity';
import { Entry } from './entry.entity';
import { ScheduledPrompt } from './scheduled-prompt.entity';
import type {
  VisualRulesConfig,
  FramingRulesConfig,
  CadenceConfigData,
} from './journal-template.entity';

/**
 * AI settings for a specific journal (premium feature)
 */
export interface JournalAISettings {
  enabled: boolean;
  consent: {
    promptGeneration: boolean;
    contentAnalysis: boolean;
    narrativeGeneration: boolean;
    schedulingOptimization: boolean;
  };
  dataRetention: {
    analysisResultsDays: number;
    generatedContentDays: number;
    deleteOnJournalArchive: boolean;
  };
  excludedParticipantIds: string[];
  contentRestrictions: {
    excludePhotos: boolean;
    excludeTopics: string[];
  };
}

/**
 * Journal statistics (cached for performance)
 */
export interface JournalStats {
  entryCount: number;
  participantCount: number;
  photoCount: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: Date | null;
}

/**
 * AI analysis state (premium)
 */
export interface JournalAIState {
  lastAnalysisAt: Date | null;
  detectedThemes: string[];
  suggestedChapterBreaks: string[];  // Entry IDs
  highlightedEntryIds: string[];
}

@Entity('journals')
export class Journal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  owner_id: string;

  @ManyToOne(() => User, (user) => user.journals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'family' })
  template_type: string; // 'family', 'friends', 'romantic', 'vacation', 'custom'

  // Reference to the template used (for custom overrides tracking)
  @Column({ nullable: true })
  template_id: string;

  @Column({ nullable: true })
  cover_image_url: string;

  @Column({ default: 'active' })
  status: string; // 'active', 'paused', 'archived'

  // Scheduling settings (can override template defaults)
  @Column({ default: 'weekly' })
  prompt_frequency: string; // 'daily', 'weekly', 'biweekly', 'monthly'

  @Column({ type: 'int', nullable: true })
  prompt_day_of_week: number; // 0-6 for Sunday-Saturday

  @Column({ type: 'time', default: '09:00:00' })
  prompt_time: string;

  @Column({ default: 'America/New_York' })
  timezone: string;

  // Custom overrides for template visual rules
  @Column({ type: 'jsonb', nullable: true })
  custom_visual_rules: Partial<VisualRulesConfig>;

  // Custom overrides for template framing rules
  @Column({ type: 'jsonb', nullable: true })
  custom_framing_rules: Partial<FramingRulesConfig>;

  // Custom overrides for template cadence config
  @Column({ type: 'jsonb', nullable: true })
  custom_cadence_config: Partial<CadenceConfigData>;

  // AI settings (premium)
  @Column({ type: 'jsonb', nullable: true })
  ai_settings: JournalAISettings;

  // Cached statistics
  @Column({ type: 'jsonb', nullable: true })
  stats: JournalStats;

  // AI analysis state (premium)
  @Column({ type: 'jsonb', nullable: true })
  ai_state: JournalAIState;

  // Sharing
  @Column({ nullable: true, unique: true })
  share_token: string;

  @Column({ default: false })
  is_shared: boolean;

  @Column({ nullable: true })
  shared_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Participant, (participant) => participant.journal)
  participants: Participant[];

  @OneToMany(() => Entry, (entry) => entry.journal)
  entries: Entry[];

  @OneToMany(() => ScheduledPrompt, (sp) => sp.journal)
  scheduled_prompts: ScheduledPrompt[];
}
