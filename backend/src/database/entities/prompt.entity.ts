import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { JournalTemplate } from './journal-template.entity';
import { ScheduledPrompt } from './scheduled-prompt.entity';

/**
 * Seasonality constraints for prompts
 */
export interface PromptSeasonality {
  months?: number[];           // 1-12
  daysOfWeek?: number[];       // 0-6 (Sunday = 0)
  holidays?: string[];         // 'thanksgiving', 'christmas', 'valentines', etc.
}

/**
 * Targeting rules for prompts
 */
export interface PromptTargeting {
  relationships?: string[];    // 'parent', 'grandparent', 'sibling', etc.
  minResponses?: number;       // Only after N responses from participant
  maxResponses?: number;       // Stop after N responses
}

@Entity('prompts')
export class Prompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  template_id: string;

  @ManyToOne(() => JournalTemplate, (template) => template.prompts, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'template_id' })
  template: JournalTemplate;

  @Column({ type: 'text' })
  text: string;

  // Category: memories, gratitude, milestones, traditions, wisdom, stories, dreams, daily, reflection, adventure
  @Column({ nullable: true })
  category: string;

  // Tone: warm, playful, reflective, celebratory, nostalgic, intimate
  @Column({ nullable: true })
  tone: string;

  // Frequency weighting (1-10, higher = more likely to be selected)
  @Column({ type: 'int', default: 5 })
  weight: number;

  @Column({ type: 'int', nullable: true })
  sequence_order: number;

  // Season/time restrictions
  @Column({ type: 'jsonb', nullable: true })
  seasonality: PromptSeasonality;

  // Participant targeting
  @Column({ type: 'jsonb', nullable: true })
  targeting: PromptTargeting;

  // Follow-up prompt reference (for conversational threads)
  @Column({ nullable: true })
  follow_up_to: string;

  // Good for first prompt to new participant
  @Column({ default: false })
  is_starter: boolean;

  // Hints that photo response is expected
  @Column({ default: false })
  requires_photo: boolean;

  // Emotionally deeper, use sparingly
  @Column({ default: false })
  is_deep: boolean;

  @Column({ default: false })
  is_custom: boolean;

  // AI-generated prompt
  @Column({ default: false })
  is_ai_generated: boolean;

  // Global usage tracking
  @Column({ type: 'int', default: 0 })
  usage_count: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => ScheduledPrompt, (sp) => sp.prompt)
  scheduled_prompts: ScheduledPrompt[];
}
