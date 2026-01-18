import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { entriesApi, setGetTokenFn } from '../api';
import type { CreateEntryDto } from '../api';

export function useCreateEntry(journalId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (data: CreateEntryDto) => entriesApi.create(journalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', journalId] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (id: string) => entriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });
}
