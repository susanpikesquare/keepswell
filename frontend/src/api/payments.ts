import { apiClient } from './client';

export interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'pro' | 'event';
  status: 'active' | 'canceled' | 'past_due' | 'none' | 'trialing';
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  eventPassExpiresAt?: string | null;
  extraParticipantSlots?: number;
}

export interface SmsUsageStats {
  smsThisMonth: number;
  smsLimit: number; // -1 means unlimited
  smsRemaining: number; // -1 means unlimited
  invitesTotal: number;
  invitesLimit: number; // -1 means unlimited
  invitesRemaining: number; // -1 means unlimited
  tier: string;
  isPremium: boolean;
  monthResetDate: string | null;
}

export interface UsageLimits {
  journalCount: number;
  maxJournals: number; // -1 means unlimited
  canCreateJournal: boolean;
  tier: string;
  isPro: boolean;
  smsEnabled: boolean;
}

export const paymentsApi = {
  createCheckoutSession: async (
    returnUrl: string,
    billingPeriod: 'monthly' | 'yearly' = 'monthly',
  ): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>('/payments/create-checkout-session', {
      returnUrl,
      billingPeriod,
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

  getUsageStats: async (): Promise<SmsUsageStats> => {
    const response = await apiClient.get<SmsUsageStats>('/payments/usage-stats');
    return response.data;
  },

  getUsageLimits: async (): Promise<UsageLimits> => {
    const response = await apiClient.get<UsageLimits>('/payments/usage-limits');
    return response.data;
  },

  createEventPassCheckout: async (returnUrl: string): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>('/payments/create-event-pass-checkout', {
      returnUrl,
    });
    return response.data;
  },

  createParticipantBundleCheckout: async (
    returnUrl: string,
    quantity: number = 1,
  ): Promise<{ url: string }> => {
    const response = await apiClient.post<{ url: string }>('/payments/create-participant-bundle-checkout', {
      returnUrl,
      quantity,
    });
    return response.data;
  },
};
