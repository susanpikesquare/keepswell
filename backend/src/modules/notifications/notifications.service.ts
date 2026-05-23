import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

import {
  PushToken,
  Journal,
  Participant,
  User,
  NotificationPreference,
} from '../../database/entities';

/** Event kinds we send notifications for. Add new ones here. */
export type NotificationEventKind =
  | 'entry'
  | 'comment'
  | 'reaction'
  | 'participant_joined';

/** Per-journal preferences shape exposed to the API. */
export interface NotificationPreferencesDto {
  notify_entries: boolean;
  notify_comments: boolean;
  notify_reactions: boolean;
  notify_joins: boolean;
}

const PREFS_DEFAULT: NotificationPreferencesDto = {
  notify_entries: true,
  notify_comments: true,
  notify_reactions: true,
  notify_joins: true,
};

export interface NotificationPayload {
  /** Title shown at the top of the push banner. */
  title: string;
  /** Body / message under the title. */
  body: string;
  /**
   * Data carried with the push. Used on the device to deep-link or display
   * contextual info. Keep this small — APNs limits payloads to ~4KB.
   * Suggested keys: { kind: 'entry'|'comment'|'reaction'|'participant',
   *                   journalId, entryId?, commentId?, participantId? }
   */
  data?: Record<string, any>;
  /** iOS badge count override; if omitted, badge is left alone. */
  badge?: number;
  /** Optional category id for iOS notification actions. */
  categoryId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo({
    // Optional: accessToken is only needed if "Enhanced security for push
    // notifications" is enabled in Expo dashboard.
    accessToken: process.env.EXPO_ACCESS_TOKEN,
  });

  constructor(
    @InjectRepository(PushToken)
    private readonly pushTokenRepo: Repository<PushToken>,
    @InjectRepository(Journal)
    private readonly journalRepo: Repository<Journal>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(NotificationPreference)
    private readonly prefRepo: Repository<NotificationPreference>,
  ) {}

  // ---- Preferences ------------------------------------------------------

  /** Map a NotificationEventKind to the column on NotificationPreference. */
  private prefColumnFor(kind: NotificationEventKind): keyof NotificationPreferencesDto {
    switch (kind) {
      case 'entry':
        return 'notify_entries';
      case 'comment':
        return 'notify_comments';
      case 'reaction':
        return 'notify_reactions';
      case 'participant_joined':
        return 'notify_joins';
    }
  }

  /** Read prefs for a (user, journal); returns defaults when no row exists. */
  async getPreferences(
    userId: string,
    journalId: string,
  ): Promise<NotificationPreferencesDto> {
    const row = await this.prefRepo.findOne({
      where: { user_id: userId, journal_id: journalId },
    });
    if (!row) return { ...PREFS_DEFAULT };
    return {
      notify_entries: row.notify_entries,
      notify_comments: row.notify_comments,
      notify_reactions: row.notify_reactions,
      notify_joins: row.notify_joins,
    };
  }

  /**
   * Upsert prefs. Any field omitted from `patch` keeps its current value
   * (or the default, if the row is being created).
   */
  async upsertPreferences(
    userId: string,
    journalId: string,
    patch: Partial<NotificationPreferencesDto>,
  ): Promise<NotificationPreferencesDto> {
    const existing = await this.prefRepo.findOne({
      where: { user_id: userId, journal_id: journalId },
    });

    if (existing) {
      Object.assign(existing, patch);
      const saved = await this.prefRepo.save(existing);
      return {
        notify_entries: saved.notify_entries,
        notify_comments: saved.notify_comments,
        notify_reactions: saved.notify_reactions,
        notify_joins: saved.notify_joins,
      };
    }

    const created = this.prefRepo.create({
      user_id: userId,
      journal_id: journalId,
      ...PREFS_DEFAULT,
      ...patch,
    });
    const saved = await this.prefRepo.save(created);
    return {
      notify_entries: saved.notify_entries,
      notify_comments: saved.notify_comments,
      notify_reactions: saved.notify_reactions,
      notify_joins: saved.notify_joins,
    };
  }

  /**
   * Given a candidate audience and an event kind, return the subset of users
   * who have NOT opted out of that kind for this journal. Users with no prefs
   * row pass through unchanged (defaults are opt-in).
   */
  private async filterAudienceByPrefs(
    userIds: string[],
    journalId: string,
    kind: NotificationEventKind,
  ): Promise<string[]> {
    if (!userIds.length) return userIds;
    const column = this.prefColumnFor(kind);

    const rows = await this.prefRepo.find({
      where: { user_id: In(userIds), journal_id: journalId },
    });
    const optedOut = new Set(
      rows.filter((r) => r[column] === false).map((r) => r.user_id),
    );
    return userIds.filter((id) => !optedOut.has(id));
  }

  // ---- Audience helpers -------------------------------------------------

  /**
   * Return User ids who should receive notifications for events on a journal:
   *   - the journal owner
   *   - any active Participant whose phone or email maps to a User row
   * Excludes `excludeUserId` (typically the actor who triggered the event).
   */
  async findJournalAudience(
    journalId: string,
    excludeUserId?: string,
  ): Promise<string[]> {
    const journal = await this.journalRepo.findOne({ where: { id: journalId } });
    if (!journal) return [];

    const userIds = new Set<string>();
    if (journal.owner_id) userIds.add(journal.owner_id);

    // Participants → match by phone or email to Users
    const participants = await this.participantRepo.find({
      where: { journal_id: journalId, status: 'active' },
    });

    const phones = participants
      .map((p) => p.phone_number)
      .filter((p): p is string => !!p);
    const emails = participants
      .map((p) => p.email)
      .filter((e): e is string => !!e);

    if (phones.length || emails.length) {
      const linked = await this.userRepo
        .createQueryBuilder('u')
        .select('u.id', 'id')
        .where(
          phones.length && emails.length
            ? 'u.phone_number IN (:...phones) OR u.email IN (:...emails)'
            : phones.length
              ? 'u.phone_number IN (:...phones)'
              : 'u.email IN (:...emails)',
          { phones, emails },
        )
        .getRawMany<{ id: string }>();
      linked.forEach((row) => userIds.add(row.id));
    }

    if (excludeUserId) userIds.delete(excludeUserId);
    return [...userIds];
  }

  /**
   * Convenience: dispatch a notification to everyone associated with a
   * journal (owner + linked participants), excluding the actor and anyone
   * who has opted out of this event kind in their journal preferences.
   */
  async notifyJournalAudience(
    journalId: string,
    kind: NotificationEventKind,
    payload: NotificationPayload,
    excludeUserId?: string,
  ): Promise<void> {
    const audience = await this.findJournalAudience(journalId, excludeUserId);
    if (!audience.length) {
      this.logger.debug(`notifyJournalAudience: nobody to notify for journal ${journalId}`);
      return;
    }
    const filtered = await this.filterAudienceByPrefs(audience, journalId, kind);
    if (!filtered.length) {
      this.logger.debug(
        `notifyJournalAudience: all ${audience.length} candidates opted out of ${kind} on ${journalId}`,
      );
      return;
    }
    await this.sendToUsers(filtered, payload);
  }

  // ---- Token management -------------------------------------------------

  /**
   * Register (or refresh) a push token for the given user. Idempotent: if the
   * token already exists for another user (e.g. the same device was logged in
   * to another account), the row is reassigned. If it exists for this user,
   * just bumped to `active = true`.
   */
  async registerToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web' = 'ios',
    deviceName?: string,
  ): Promise<PushToken> {
    if (!Expo.isExpoPushToken(token)) {
      this.logger.warn(`registerToken called with non-Expo token: ${token}`);
      throw new Error('Token is not a valid Expo push token');
    }

    let row = await this.pushTokenRepo.findOne({ where: { token } });

    if (row) {
      row.user_id = userId;
      row.platform = platform;
      if (deviceName !== undefined) row.device_name = deviceName;
      row.active = true;
      return this.pushTokenRepo.save(row);
    }

    row = this.pushTokenRepo.create({
      user_id: userId,
      token,
      platform,
      device_name: deviceName ?? null,
      active: true,
    });
    return this.pushTokenRepo.save(row);
  }

  /** Unregister a single token (e.g. when the user signs out on a device). */
  async unregisterToken(token: string): Promise<void> {
    await this.pushTokenRepo.delete({ token });
  }

  // ---- Sending ----------------------------------------------------------

  /**
   * Send a notification to all active tokens for a single user (one user can
   * have multiple devices). No-op if the user has no registered tokens.
   */
  async sendToUser(userId: string, payload: NotificationPayload): Promise<void> {
    return this.sendToUsers([userId], payload);
  }

  /**
   * Send a journal-scoped notification to a single user, respecting their
   * notification preferences for that journal and event kind. Use this for
   * events that only have one recipient (e.g. owner notified when someone
   * joins their journal).
   */
  async sendToUserWithPrefs(
    userId: string,
    journalId: string,
    kind: NotificationEventKind,
    payload: NotificationPayload,
  ): Promise<void> {
    const allowed = await this.filterAudienceByPrefs([userId], journalId, kind);
    if (allowed.length) await this.sendToUsers(allowed, payload);
  }

  /**
   * Send the same notification to every active token for any user in the
   * recipient list. De-duplicates by userId implicitly via the query.
   */
  async sendToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
    if (!userIds.length) return;

    const tokens = await this.pushTokenRepo.find({
      where: { user_id: In(userIds), active: true },
    });

    if (!tokens.length) {
      this.logger.debug(
        `sendToUsers: no active tokens for ${userIds.length} user(s); skipping`,
      );
      return;
    }

    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title: payload.title,
      body: payload.body,
      data: payload.data,
      badge: payload.badge,
      categoryId: payload.categoryId,
      // 'high' priority so iOS shows the banner immediately.
      priority: 'high',
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (err) {
        this.logger.error(`Failed to send push chunk: ${(err as Error).message}`);
      }
    }

    // Process tickets: mark dead tokens inactive so we don't keep hitting Expo
    // with known-bad tokens.
    await Promise.all(
      tickets.map(async (ticket, i) => {
        if (ticket.status === 'error') {
          const message = messages[i];
          const deadCode =
            ticket.details?.error === 'DeviceNotRegistered' ||
            ticket.details?.error === 'InvalidCredentials';

          this.logger.warn(
            `Push ticket error for token ${String(message.to).slice(0, 20)}…: ${ticket.message}`,
          );

          if (deadCode) {
            await this.pushTokenRepo.update(
              { token: message.to as string },
              { active: false },
            );
          }
        }
      }),
    );
  }
}
