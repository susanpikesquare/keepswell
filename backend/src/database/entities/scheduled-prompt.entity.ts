import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Journal } from './journal.entity';
import { Prompt } from './prompt.entity';
import { PromptSend } from './prompt-send.entity';

@Entity('scheduled_prompts')
export class ScheduledPrompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journal_id: string;

  @ManyToOne(() => Journal, (journal) => journal.scheduled_prompts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  @Column()
  prompt_id: string;

  @ManyToOne(() => Prompt, (prompt) => prompt.scheduled_prompts)
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  @Column({ type: 'timestamptz' })
  scheduled_for: Date;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'sent', 'failed', 'cancelled'

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => PromptSend, (ps) => ps.scheduled_prompt)
  prompt_sends: PromptSend[];
}
