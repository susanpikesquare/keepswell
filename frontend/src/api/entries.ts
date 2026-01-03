import { apiClient } from './client';
import type { Entry, PaginatedResponse } from '../types';

export interface SimulateEntryDto {
  participant_id: string;
  content: string;
  entry_type?: 'text' | 'photo' | 'mixed';
  media_urls?: string[];
}

export interface CreateWebEntryDto {
  participant_id?: string;
  content?: string;
  media_urls?: string[];
  contributor_name?: string;
}

export const entriesApi = {
  list: async (
    journalId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginatedResponse<Entry>> => {
    const response = await apiClient.get<PaginatedResponse<Entry>>(
      `/journals/${journalId}/entries`,
      { params }
    );
    return response.data;
  },

  get: async (id: string): Promise<Entry> => {
    const response = await apiClient.get<Entry>(`/entries/${id}`);
    return response.data;
  },

  /**
   * Simulate an SMS entry for testing purposes
   */
  simulate: async (journalId: string, data: SimulateEntryDto): Promise<Entry> => {
    const response = await apiClient.post<Entry>(
      `/journals/${journalId}/entries/simulate`,
      data
    );
    return response.data;
  },

  /**
   * Create an entry via web upload (FREE - no SMS limits)
   */
  create: async (journalId: string, data: CreateWebEntryDto): Promise<Entry> => {
    const response = await apiClient.post<Entry>(
      `/journals/${journalId}/entries`,
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: { is_hidden?: boolean; is_pinned?: boolean }
  ): Promise<Entry> => {
    const response = await apiClient.patch<Entry>(`/entries/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/entries/${id}`);
  },
};
