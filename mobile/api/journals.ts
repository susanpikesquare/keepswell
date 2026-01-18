import { apiClient } from './client';
import type { Journal, CreateJournalDto, Entry, PaginatedResponse } from './types';

export const journalsApi = {
  list: async (): Promise<Journal[]> => {
    const response = await apiClient.get<Journal[]>('/journals');
    return response.data;
  },

  get: async (id: string): Promise<Journal> => {
    const response = await apiClient.get<Journal>(`/journals/${id}`);
    return response.data;
  },

  create: async (data: CreateJournalDto): Promise<Journal> => {
    const response = await apiClient.post<Journal>('/journals', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateJournalDto>): Promise<Journal> => {
    const response = await apiClient.patch<Journal>(`/journals/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/journals/${id}`);
  },

  getEntries: async (
    journalId: string,
    params?: { page?: number; limit?: number; participantId?: string }
  ): Promise<PaginatedResponse<Entry>> => {
    const response = await apiClient.get<PaginatedResponse<Entry>>(
      `/journals/${journalId}/entries`,
      { params }
    );
    return response.data;
  },
};
