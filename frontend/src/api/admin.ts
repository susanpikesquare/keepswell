import { apiClient } from './client';

export interface PlatformStats {
  users: {
    total: number;
    thisMonth: number;
    byTier: { tier: string; count: number }[];
  };
  journals: {
    total: number;
    active: number;
    byTemplate: { template: string; count: number }[];
  };
  entries: {
    total: number;
    thisMonth: number;
    withMedia: number;
  };
  participants: {
    total: number;
    active: number;
  };
  projectedCosts: {
    smsMessages: number;
    smsCost: number;
    storageMB: number;
    storageCost: number;
    hostingCost: number;
    totalMonthly: number;
  };
}

export interface UserDetails {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: string;
  is_admin: boolean;
  created_at: string;
  journalCount: number;
  entryCount: number;
}

export const adminApi = {
  checkAccess: async (): Promise<{ isAdmin: boolean; clerkId: string }> => {
    const response = await apiClient.get<{ isAdmin: boolean; clerkId: string }>('/admin/me');
    return response.data;
  },

  getStats: async (): Promise<PlatformStats> => {
    const response = await apiClient.get<PlatformStats>('/admin/stats');
    return response.data;
  },

  getUsers: async (): Promise<UserDetails[]> => {
    const response = await apiClient.get<UserDetails[]>('/admin/users');
    return response.data;
  },

  setAdminStatus: async (userId: string, isAdmin: boolean): Promise<void> => {
    await apiClient.patch(`/admin/users/${userId}/admin`, { is_admin: isAdmin });
  },
};
