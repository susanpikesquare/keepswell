import { apiClient } from './client';

export interface SubscriptionStatus {
  tier: 'free' | 'premium';
  status: 'active' | 'canceled' | 'past_due' | 'none';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const paymentsApi = {
  createCheckoutSession: async (returnUrl: string): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>('/payments/create-checkout-session', {
      returnUrl,
    });
    return response.data;
  },

  createPortalSession: async (returnUrl: string): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>('/payments/create-portal-session', {
      returnUrl,
    });
    return response.data;
  },

  getSubscriptionStatus: async (): Promise<SubscriptionStatus> => {
    const response = await apiClient.get<SubscriptionStatus>('/payments/subscription-status');
    return response.data;
  },
};
