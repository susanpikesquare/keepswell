import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Journal } from './journal.entity';
import { User } from './user.entity';

/**
 * Types of AI-generated content
 */
export type AIContentType =
  | 'prompt'           // AI-generated prompt
  | 'chapter_title'    // Auto-generated chapter title
  | 'chapter_summary'  // Summary of a chapter
  | 'highlight'        // AI-selected highlight entry
  | 'narrative'        // Narrative text for export
  | 'recap'            // Periodic recap content
  | 'year_in_review'   // Annual summary
  | 'follow_up';       // Suggested follow-up prompt

/**
 * Status of AI-generated content
 */
export type AIContentStatus =
  | 'suggested'  // Generated but not reviewed
  | 'accepted'   // User approved
  | 'rejected'   // User rejected
  | 'edited';    // User modified

/**
 * Stores all AI-generated content separately from user content.
 * Original user content is NEVER modified - AI content is additive only.
 */
@Entity('ai_contents')
@Index(['journal_id', 'type'])
@Index(['journal_id', 'status'])
export class AIContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journal_id: string;

  @ManyToOne(() => Journal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  @Column()
  type: AIContentType;

  // The generated content
  @Column({ type: 'text' })
  content: string;

  // Optional title for the content
  @Column({ nullable: true })
  title: string;

  // Source entry IDs used to generate this content
  @Column({ type: 'jsonb', default: '[]' })
  source_entry_ids: string[];

  // Source prompt IDs if relevant
  @Column({ type: 'jsonb', default: '[]' })
  source_prompt_ids: string[];

  // Confidence score (0-1)
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  confidence: number;

  // User review status
  @Column({ default: 'suggested' })
  status: AIContentStatus;

  // User-edited version of the content
  @Column({ type: 'text', nullable: true })
  user_edited_content: string;

  // Who reviewed/edited this content
  @Column({ nullable: true })
  reviewed_by: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewed_at: Date;

  // Model information
  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  model_version: string;

  // Context information (for debugging/analysis)
  @Column({ type: 'jsonb', nullable: true })
  generation_context: Record<string, unknown>;

  // Expiration for time-sensitive content
  @Column({ type: 'timestamp with time zone', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
