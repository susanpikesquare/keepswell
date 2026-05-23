// Notification preferences API client.

import { apiClient } from './client';

export interface NotificationPreferences {
  notify_entries: boolean;
  notify_comments: boolean;
  notify_reactions: boolean;
  notify_joins: boolean;
}

export const notificationsApi = {
  /** Get prefs for the signed-in user on a journal. Returns defaults (all on) when no row exists. */
  async getPreferences(journalId: string): Promise<NotificationPreferences> {
    const res = await apiClient.get<NotificationPreferences>(
      `/notifications/preferences/${journalId}`,
    );
    return res.data;
  },

  /** Update one or more fields. Returns the new full preferences state. */
  async updatePreferences(
    journalId: string,
    patch: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const res = await apiClient.put<NotificationPreferences>(
      `/notifications/preferences/${journalId}`,
      patch,
    );
    return res.data;
  },
};
