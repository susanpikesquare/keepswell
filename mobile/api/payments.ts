import { apiClient } from './client';
import type { UsageLimits, SubscriptionStatus, Pricing } from './types';

export type { SubscriptionStatus };

export const paymentsApi = {
  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get<SubscriptionStatus>('/payments/subscription-status');
    return response.data;
  },

  getUsageLimits: async (): Promise<UsageLimits> => {
    const response = await apiClient.get<UsageLimits>('/payments/usage-limits');
    return response.data;
  },

  getPricing: async (): Promise<Pricing> => {
    const response = await apiClient.get<Pricing>('/payments/pricing');
    return response.data;
  },

  syncRevenueCat: async (): Promise<void> => {
    await apiClient.post('/payments/sync-revenuecat');
  },
};
