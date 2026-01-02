import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { paymentsApi, exportApi, setAuthToken, setGetTokenFn } from '../api';
import type { ExportOptions } from '../api';

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

export function useCreateCheckoutSession() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (returnUrl: string) => {
      const token = await getToken();
      setAuthToken(token);
      return paymentsApi.createCheckoutSession(returnUrl);
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

  return {
    isPremium: subscription?.tier === 'premium' && subscription?.status === 'active',
    isLoading,
    subscription,
  };
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
