import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Journal } from './journal.entity';
import { Prompt } from './prompt.entity';
import { Participant } from './participant.entity';
import { Entry } from './entry.entity';

/**
 * Tracks prompt usage per journal to avoid repetition and enable smart rotation
 */
@Entity('prompt_usage_logs')
@Index(['journal_id', 'prompt_id'])
@Index(['journal_id', 'participant_id'])
@Index(['journal_id', 'sent_at'])
export class PromptUsageLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journal_id: string;

  @ManyToOne(() => Journal, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  @Column()
  prompt_id: string;

  @ManyToOne(() => Prompt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  @Column()
  participant_id: string;

  @ManyToOne(() => Participant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  // When the prompt was sent
  @Column({ type: 'timestamp with time zone' })
  sent_at: Date;

  // When participant responded (null if no response)
  @Column({ type: 'timestamp with time zone', nullable: true })
  responded_at: Date;

  // Link to the response entry
  @Column({ nullable: true })
  response_entry_id: string;

  @ManyToOne(() => Entry, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'response_entry_id' })
  response_entry: Entry;

  // Category of the prompt (denormalized for quick filtering)
  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  created_at: Date;
}
