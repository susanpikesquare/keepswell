import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScheduledPrompt } from './scheduled-prompt.entity';
import { Participant } from './participant.entity';

@Entity('prompt_sends')
export class PromptSend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  scheduled_prompt_id: string;

  @ManyToOne(() => ScheduledPrompt, (sp) => sp.prompt_sends, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'scheduled_prompt_id' })
  scheduled_prompt: ScheduledPrompt;

  @Column()
  participant_id: string;

  @ManyToOne(() => Participant, (participant) => participant.prompt_sends, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_id' })
  participant: Participant;

  @Column({ nullable: true })
  twilio_message_sid: string;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'sent', 'delivered', 'failed'

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  delivered_at: Date;

  /**
   * Channel this send used. Determines whether the SMS columns
   * (twilio_message_sid, status='delivered' via Telnyx callback) or the
   * in-app feed semantics apply.
   */
  @Column({ type: 'varchar', length: 16, default: 'sms' })
  channel: 'sms' | 'in_app';

  /**
   * Set when the participant responded to this prompt (via SMS reply that
   * created an entry, or via the in-app "Respond" tap). Lets us hide
   * already-answered prompts from the in-app feed.
   */
  @Column({ type: 'timestamptz', nullable: true })
  responded_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
