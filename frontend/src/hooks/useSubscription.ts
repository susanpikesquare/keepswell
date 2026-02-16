import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { paymentsApi, exportApi, setAuthToken, setGetTokenFn } from '../api';
import type { ExportOptions, SmsUsageStats, UsageLimits } from '../api';

export function useSubscriptionStatus() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['subscription'],
    queryFn: paymentsApi.getSubscriptionStatus,
    enabled: isLoaded && isSignedIn,
  });
}

export function useUsageStats() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery<SmsUsageStats>({
    queryKey: ['usage-stats'],
    queryFn: paymentsApi.getUsageStats,
    enabled: isLoaded && isSignedIn,
  });
}

export function useUsageLimits() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery<UsageLimits>({
    queryKey: ['usage-limits'],
    queryFn: paymentsApi.getUsageLimits,
    enabled: isLoaded && isSignedIn,
  });
}

export function useCreateCheckoutSession() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      returnUrl,
      billingPeriod = 'monthly',
    }: {
      returnUrl: string;
      billingPeriod?: 'monthly' | 'yearly';
    }) => {
      const token = await getToken();
      setAuthToken(token);
      return paymentsApi.createCheckoutSession(returnUrl, billingPeriod);
    },
    onSuccess: async (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useCreatePortalSession() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (returnUrl: string) => {
      const token = await getToken();
      setAuthToken(token);
      return paymentsApi.createPortalSession(returnUrl);
    },
    onSuccess: async (data) => {
      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useIsPremium() {
  const { data: subscription, isLoading } = useSubscriptionStatus();

  // Check for both 'premium' and 'pro' tiers for backwards compatibility
  const isPaidTier = subscription?.tier === 'premium' || subscription?.tier === 'pro';

  return {
    isPremium: isPaidTier && subscription?.status === 'active',
    isLoading,
    subscription,
  };
}

export function useIsPro() {
  const { data: subscription, isLoading } = useSubscriptionStatus();

  // Check for both 'premium' and 'pro' tiers for backwards compatibility
  const isPaidTier = subscription?.tier === 'premium' || subscription?.tier === 'pro';

  return {
    isPro: isPaidTier && subscription?.status === 'active',
    isLoading,
    subscription,
  };
}

export function useCreateEventPassCheckout() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (returnUrl: string) => {
      const token = await getToken();
      setAuthToken(token);
      return paymentsApi.createEventPassCheckout(returnUrl);
    },
    onSuccess: async (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useCreateParticipantBundleCheckout() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ returnUrl, quantity = 1 }: { returnUrl: string; quantity?: number }) => {
      const token = await getToken();
      setAuthToken(token);
      return paymentsApi.createParticipantBundleCheckout(returnUrl, quantity);
    },
    onSuccess: async (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}

export function useExportPdf() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ journalId, options }: { journalId: string; options?: ExportOptions }) => {
      const token = await getToken();
      setAuthToken(token);
      return exportApi.exportPdf(journalId, options);
    },
    onSuccess: (blob, { journalId }) => {
      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `memory-book-${journalId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });
}
