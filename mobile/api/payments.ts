import { apiClient } from './client';
import type { UsageLimits } from './types';

export interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'none';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const paymentsApi = {
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get<SubscriptionStatus>('/payments/subscription-status');
    return response.data;
  },

  getUsageLimits: async (): Promise<UsageLimits> => {
    const response = await apiClient.get<UsageLimits>('/payments/usage-limits');
    return response.data;
  },
};
