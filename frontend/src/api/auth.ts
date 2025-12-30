import { apiClient } from './client';
import type { User } from '../types';

export const authApi = {
  syncUser: async (userData: {
    clerk_id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    avatar_url?: string;
  }): Promise<User> => {
    const response = await apiClient.post<User>('/auth/sync', userData);
    return response.data;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
