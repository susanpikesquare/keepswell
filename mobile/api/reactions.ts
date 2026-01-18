import { apiClient } from './client';
import type { Reaction, EntryReactions, CreateReactionDto, ToggleReactionResponse } from './types';

export const reactionsApi = {
  /**
   * Get all reactions for an entry, grouped by emoji
   */
  list: async (entryId: string): Promise<EntryReactions> => {
    const response = await apiClient.get<EntryReactions>(
      `/entries/${entryId}/reactions`
    );
    return response.data;
  },

  /**
   * Add a reaction to an entry
   */
  create: async (entryId: string, data: CreateReactionDto): Promise<Reaction> => {
    const response = await apiClient.post<Reaction>(
      `/entries/${entryId}/reactions`,
      data
    );
    return response.data;
  },

  /**
   * Toggle a reaction (add if doesn't exist, remove if exists)
   */
  toggle: async (entryId: string, data: CreateReactionDto): Promise<ToggleReactionResponse> => {
    const response = await apiClient.post<ToggleReactionResponse>(
      `/entries/${entryId}/reactions/toggle`,
      data
    );
    return response.data;
  },

  /**
   * Remove a reaction from an entry
   */
  remove: async (entryId: string, emoji: string, participantId?: string): Promise<void> => {
    const params = participantId ? { participant_id: participantId } : {};
    await apiClient.delete(`/entries/${entryId}/reactions/${emoji}`, { params });
  },
};
