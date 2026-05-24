import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Journal } from './journal.entity';
import { Entry } from './entry.entity';
import { PromptSend } from './prompt-send.entity';

@Entity('participants')
@Unique(['journal_id', 'phone_number'])
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journal_id: string;

  @ManyToOne(() => Journal, (journal) => journal.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  @Column()
  phone_number: string;

  @Column({ nullable: true })
  email: string;

  @Column()
  display_name: string;

  @Column({ nullable: true })
  relationship: string; // 'parent', 'sibling', 'friend', 'partner', etc.

  @Column({ nullable: true })
  avatar_url: string;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'active', 'paused', 'removed'

  @Column({ nullable: true, unique: true })
  magic_token: string;

  @Column({ type: 'timestamptz', nullable: true })
  magic_token_expires_at: Date;

  @Column({ nullable: true })
  verification_code: string;

  @Column({ type: 'timestamptz', nullable: true })
  verification_code_expires_at: Date;

  @Column({ default: false })
  opted_in: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  opted_in_at: Date;

  /**
   * How this participant prefers to receive prompts.
   *   'sms'    → text-only (requires phone_number, requires opted_in)
   *   'in_app' → push notification + in-app prompt feed (requires linked
   *              User account with a PushToken; app-only users)
   *   'both'   → SMS first, also surfaces in the in-app feed (default for
   *              participants who have both a phone and an app account)
   *
   * Default 'sms' preserves backwards compatibility for participants
   * created before this column existed (they were always SMS-based).
   * The scheduler honors this on dispatch.
   */
  @Column({ type: 'varchar', length: 16, default: 'sms' })
  delivery_channel: 'sms' | 'in_app' | 'both';

  @Column({ type: 'timestamptz', nullable: true })
  last_response_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Entry, (entry) => entry.participant)
  entries: Entry[];

  @OneToMany(() => PromptSend, (ps) => ps.participant)
  prompt_sends: PromptSend[];
}
