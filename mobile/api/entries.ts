import { apiClient } from './client';
import type { Entry, CreateEntryDto } from './types';

export const entriesApi = {
  get: async (id: string): Promise<Entry> => {
    const response = await apiClient.get<Entry>(`/entries/${id}`);
    return response.data;
  },

  create: async (journalId: string, data: CreateEntryDto): Promise<Entry> => {
    const response = await apiClient.post<Entry>(`/journals/${journalId}/entries`, data);
    return response.data;
  },

  update: async (id: string, data: { is_hidden?: boolean; is_pinned?: boolean }): Promise<Entry> => {
    const response = await apiClient.patch<Entry>(`/entries/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entries/${id}`);
  },
};
