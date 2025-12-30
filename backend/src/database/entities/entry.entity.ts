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
import { Journal } from './journal.entity';
import { Participant } from './participant.entity';
import { PromptSend } from './prompt-send.entity';
import { MediaAttachment } from './media-attachment.entity';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  journal_id: string;

  @ManyToOne(() => Journal, (journal) => journal.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_id' })
  journal: Journal;

  @Column()
  participant_id: string;

  @ManyToOne(() => Participant, (participant) => participant.entries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ nullable: true })
  prompt_send_id: string;

  @ManyToOne(() => PromptSend, { nullable: true })
  @JoinColumn({ name: 'prompt_send_id' })
  prompt_send: PromptSend;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  twilio_message_sid: string;

  @Column({ nullable: true })
  from_phone_number: string;

  @Column({ default: 'text' })
  entry_type: string; // 'text', 'photo', 'mixed'

  @Column({ default: false })
  is_hidden: boolean;

  @Column({ default: false })
  is_pinned: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => MediaAttachment, (media) => media.entry)
  media_attachments: MediaAttachment[];
}
