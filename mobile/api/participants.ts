import { apiClient } from './client';
import type { Participant, InviteParticipantDto } from './types';

export const participantsApi = {
  list: async (journalId: string): Promise<Participant[]> => {
    const response = await apiClient.get<Participant[]>(
      `/journals/${journalId}/participants`
    );
    return response.data;
  },

  invite: async (journalId: string, data: InviteParticipantDto): Promise<Participant> => {
    const response = await apiClient.post<Participant>(
      `/journals/${journalId}/participants`,
      data
    );
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<{ display_name: string; status: string }>
  ): Promise<Participant> => {
    const response = await apiClient.patch<Participant>(`/participants/${id}`, data);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/participants/${id}`);
  },

  resendInvite: async (id: string): Promise<void> => {
    await apiClient.post(`/participants/${id}/resend-invite`);
  },

  approve: async (id: string): Promise<Participant> => {
    const response = await apiClient.post<Participant>(`/participants/${id}/approve`);
    return response.data;
  },

  decline: async (id: string): Promise<void> => {
    await apiClient.post(`/participants/${id}/decline`);
  },
};
