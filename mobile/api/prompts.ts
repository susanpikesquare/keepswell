import { apiClient } from './client';
import type { Prompt } from './types';

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
};
