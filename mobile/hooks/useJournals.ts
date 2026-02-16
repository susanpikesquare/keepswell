import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { journalsApi, setGetTokenFn } from '../api';
import type { CreateJournalDto } from '../api';

export function useJournals() {
  const { getToken } = useAuth();

  // Set up token function for API client
  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journals'],
    queryFn: journalsApi.list,
  });
}

export function useJournal(id: string) {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journal', id],
    queryFn: () => journalsApi.get(id),
    enabled: !!id,
  });
}

export function useJournalEntries(journalId: string, page = 1, limit = 20) {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journal-entries', journalId, page, limit],
    queryFn: () => journalsApi.getEntries(journalId, { page, limit }),
    enabled: !!journalId,
  });
}

export function useCreateJournal() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (data: CreateJournalDto) => journalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}

export function useUpdateJournal() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateJournalDto> }) =>
      journalsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['journal', id] });
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}

export function useDeleteJournal() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (id: string) => journalsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}
