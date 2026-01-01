import { apiClient } from './client';
import type { Journal, CreateJournalDto, Entry, PaginatedResponse } from '../types';

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

  generateDemoData: async (journalId: string): Promise<{ entriesCreated: number; participantsCreated: number }> => {
    const response = await apiClient.post<{ entriesCreated: number; participantsCreated: number }>(
      `/journals/${journalId}/demo-data`
    );
    return response.data;
  },

  // Sharing
  getSharingStatus: async (journalId: string): Promise<{
    isShared: boolean;
    shareToken: string | null;
    shareUrl: string | null;
    sharedAt: string | null;
  }> => {
    const response = await apiClient.get(`/journals/${journalId}/share`);
    return response.data;
  },

  enableSharing: async (journalId: string): Promise<{ shareToken: string; shareUrl: string }> => {
    const response = await apiClient.post(`/journals/${journalId}/share`);
    return response.data;
  },

  disableSharing: async (journalId: string): Promise<void> => {
    await apiClient.delete(`/journals/${journalId}/share`);
  },

  getSharedJournal: async (token: string): Promise<{
    journal: Partial<Journal>;
    entries: Entry[];
  }> => {
    const response = await apiClient.get(`/journals/shared/${token}`);
    return response.data;
  },

  // Phone verification for shared journals
  sendVerificationCode: async (token: string, phoneNumber: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    const response = await apiClient.post(`/journals/shared/${token}/verify/send`, { phoneNumber });
    return response.data;
  },

  verifyAndGetSharedJournal: async (token: string, phoneNumber: string, code: string): Promise<{
    journal: Partial<Journal>;
    entries: Entry[];
    participantId: string;
  }> => {
    const response = await apiClient.post(`/journals/shared/${token}/verify`, { phoneNumber, code });
    return response.data;
  },
};
