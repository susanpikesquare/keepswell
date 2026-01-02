import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * Stores pending messages when a user is in multiple journals
 * and needs to select which journal to post to.
 *
 * Messages expire after 15 minutes if no selection is made.
 */
@Entity('pending_memories')
export class PendingMemory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  phone_number: string;

  @Column({ type: 'text' })
  content: string;

  @Column('simple-array', { nullable: true })
  image_urls: string[];

  @Column('simple-array')
  journal_ids: string[];

  @Column('simple-array')
  participant_ids: string[];

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
