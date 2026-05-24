import { apiClient } from './client';
import type { Prompt } from './types';

/**
 * One row in the user's in-app prompts feed. The backend returns these from
 * GET /prompts/feed for every channel='in_app' PromptSend that hasn't been
 * responded to yet.
 */
export interface InAppPromptFeedItem {
  promptSendId: string;
  scheduledPromptId: string | null;
  participantId: string;
  journalId: string | null;
  journalTitle: string | null;
  promptText: string | null;
  promptCategory: string | null;
  sentAt: string | null;
  createdAt: string;
}

/**
 * One row in the owner-facing "Upcoming prompts" list — both pending future
 * sends and recently-sent prompts, so the owner has context when editing.
 */
export interface UpcomingPromptItem {
  scheduledPromptId: string;
  promptId: string;
  text: string | null;
  category: string | null;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt: string | null;
  isCustom: boolean;
}

export const promptsApi = {
  getJournalPrompts: async (journalId: string): Promise<Prompt[]> => {
    const response = await apiClient.get<Prompt[]>(`/templates/journal/${journalId}/prompts`);
    return response.data;
  },

  updatePromptOrder: async (journalId: string, promptIds: string[]): Promise<void> => {
    await apiClient.patch(`/templates/journal/${journalId}/prompt-order`, { promptIds });
  },

  resetPromptOrder: async (journalId: string): Promise<void> => {
    await apiClient.patch(`/templates/journal/${journalId}/prompt-order/reset`);
  },

  createJournalPrompt: async (
    journalId: string,
    data: {
      text: string;
      category?: string;
      is_starter?: boolean;
      is_deep?: boolean;
      requires_photo?: boolean;
    }
  ): Promise<Prompt> => {
    const response = await apiClient.post<Prompt>(`/templates/journal/${journalId}/prompts`, data);
    return response.data;
  },

  updateJournalPrompt: async (
    journalId: string,
    promptId: string,
    data: {
      text?: string;
      category?: string;
      is_starter?: boolean;
      is_deep?: boolean;
      requires_photo?: boolean;
    }
  ): Promise<Prompt> => {
    const response = await apiClient.patch<Prompt>(
      `/templates/journal/${journalId}/prompts/${promptId}`,
      data
    );
    return response.data;
  },

  deleteJournalPrompt: async (journalId: string, promptId: string): Promise<void> => {
    await apiClient.delete(`/templates/journal/${journalId}/prompts/${promptId}`);
  },

  // ---- In-app prompts feed (for the participant) ----------------------

  /** Pending in-app prompts for the signed-in user across all their journals. */
  getInAppFeed: async (limit = 50): Promise<InAppPromptFeedItem[]> => {
    const response = await apiClient.get<{ items: InAppPromptFeedItem[] }>(
      '/prompts/feed',
      { params: { limit } },
    );
    return response.data.items;
  },

  /** Mark an in-app prompt as responded (or dismissed). */
  markPromptResponded: async (promptSendId: string): Promise<void> => {
    await apiClient.post(`/prompts/sends/${promptSendId}/responded`);
  },

  // ---- Owner: manage upcoming prompts ---------------------------------

  /** List upcoming + recently-sent prompts for a journal (owner only). */
  getUpcomingPrompts: async (journalId: string): Promise<UpcomingPromptItem[]> => {
    const response = await apiClient.get<{ items: UpcomingPromptItem[] }>(
      `/prompts/upcoming/${journalId}`,
    );
    return response.data.items;
  },

  /** Owner adds a custom prompt to the schedule. */
  addUpcomingPrompt: async (
    journalId: string,
    body: { text: string; scheduledFor: string; category?: string },
  ): Promise<UpcomingPromptItem> => {
    const response = await apiClient.post<UpcomingPromptItem>(
      `/prompts/upcoming/${journalId}`,
      body,
    );
    return response.data;
  },

  /** Owner edits a queued prompt's text or scheduled time. */
  editUpcomingPrompt: async (
    scheduledPromptId: string,
    body: { text?: string; scheduledFor?: string },
  ): Promise<UpcomingPromptItem> => {
    const response = await apiClient.patch<UpcomingPromptItem>(
      `/prompts/upcoming/${scheduledPromptId}`,
      body,
    );
    return response.data;
  },

  /** Owner cancels a queued prompt. */
  cancelUpcomingPrompt: async (scheduledPromptId: string): Promise<void> => {
    await apiClient.delete(`/prompts/upcoming/${scheduledPromptId}`);
  },
};
