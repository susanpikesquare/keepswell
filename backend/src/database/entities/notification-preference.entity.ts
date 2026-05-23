import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';

/**
 * Per-(user, journal) push notification preferences.
 *
 * Default behavior when no row exists is "opt-in for everything" — we only
 * persist a row when a user changes something away from the defaults, so the
 * table stays small.
 *
 * On dispatch, the NotificationsService looks up rows for the candidate
 * audience and filters out any user who has explicitly disabled the event
 * type for that journal.
 */
@Entity('notification_preferences')
@Unique(['user_id', 'journal_id'])
@Index(['user_id'])
@Index(['journal_id'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  journal_id: string;

  /** New memory (entry) posted to this journal. */
  @Column({ default: true })
  notify_entries: boolean;

  /** New comment on any entry in this journal. */
  @Column({ default: true })
  notify_comments: boolean;

  /** New reaction on any entry in this journal. */
  @Column({ default: true })
  notify_reactions: boolean;

  /** Someone joined the journal (participant approved). */
  @Column({ default: true })
  notify_joins: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
