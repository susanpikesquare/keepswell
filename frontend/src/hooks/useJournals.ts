import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { journalsApi, setAuthToken, setGetTokenFn } from '../api';
import type { CreateJournalDto } from '../types';

export function useJournals() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Ensure getToken is registered before queries run
  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journals'],
    queryFn: journalsApi.list,
    enabled: isLoaded && isSignedIn,
  });
}

export function useJournal(id: string) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Ensure getToken is registered before queries run
  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journals', id],
    queryFn: () => journalsApi.get(id),
    enabled: !!id && isLoaded && isSignedIn,
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateJournalDto) => {
      // Ensure token is set before making the request
      const token = await getToken();
      setAuthToken(token);
      return journalsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateJournalDto> }) => {
      // Ensure token is set before making the request
      const token = await getToken();
      setAuthToken(token);
      return journalsApi.update(id, data);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      queryClient.invalidateQueries({ queryKey: ['journals', id] });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => journalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}

export function useJournalEntries(journalId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['journals', journalId, 'entries', params],
    queryFn: () => journalsApi.getEntries(journalId, params),
    enabled: !!journalId,
  });
}

export function useGenerateDemoData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journalId: string) => journalsApi.generateDemoData(journalId),
    onSuccess: (_, journalId) => {
      // Invalidate entries and participants for this journal
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'entries'] });
      queryClient.invalidateQueries({ queryKey: ['participants', journalId] });
      queryClient.invalidateQueries({ queryKey: ['journals', journalId] });
    },
  });
}

// Sharing hooks
export function useSharingStatus(journalId: string) {
  return useQuery({
    queryKey: ['journals', journalId, 'share'],
    queryFn: () => journalsApi.getSharingStatus(journalId),
    enabled: !!journalId,
  });
}

export function useEnableSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journalId: string) => journalsApi.enableSharing(journalId),
    onSuccess: (_, journalId) => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'share'] });
    },
  });
}

export function useDisableSharing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (journalId: string) => journalsApi.disableSharing(journalId),
    onSuccess: (_, journalId) => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'share'] });
    },
  });
}

export function useSharedJournal(token: string) {
  return useQuery({
    queryKey: ['shared', token],
    queryFn: () => journalsApi.getSharedJournal(token),
    enabled: !!token,
    retry: false, // Don't retry on 404
  });
}

// Phone verification hooks for shared journals
export function useSendVerificationCode() {
  return useMutation({
    mutationFn: ({ token, phoneNumber }: { token: string; phoneNumber: string }) =>
      journalsApi.sendVerificationCode(token, phoneNumber),
  });
}

export function useVerifyAndGetSharedJournal() {
  return useMutation({
    mutationFn: ({ token, phoneNumber, code }: { token: string; phoneNumber: string; code: string }) =>
      journalsApi.verifyAndGetSharedJournal(token, phoneNumber, code),
  });
}
