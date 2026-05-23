import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * A push notification token tied to a single user + device.
 *
 * We store Expo push tokens (the abstraction over APNs / FCM) because the
 * mobile app uses expo-notifications. The token shape is
 * `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`.
 *
 * One user can have multiple tokens (multiple iPhones / iPads). When a user
 * uninstalls the app, the token becomes invalid; we mark it inactive on the
 * next failed send rather than deleting immediately (so re-installs reuse the
 * row).
 */
@Entity('push_tokens')
@Index(['user_id'])
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** FK → users.id. Indexed for fast lookup by recipient. */
  @Column({ type: 'uuid' })
  user_id: string;

  /** The Expo push token returned by `Notifications.getExpoPushTokenAsync()`. */
  @Column({ unique: true })
  token: string;

  /** Platform string for diagnostics (ios | android | web). */
  @Column({ default: 'ios' })
  platform: string;

  /** Device label (e.g. "iPhone 15"), best-effort, optional. */
  @Column({ nullable: true })
  device_name: string | null;

  /**
   * Set to false when Expo reports the token as `DeviceNotRegistered`.
   * Kept around so we don't repeatedly try and fail.
   */
  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
