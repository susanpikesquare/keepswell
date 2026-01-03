import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { entriesApi } from '../api';
import type { SimulateEntryDto, CreateWebEntryDto } from '../api';

export function useEntries(journalId: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['journals', journalId, 'entries', params],
    queryFn: () => entriesApi.list(journalId, params),
    enabled: !!journalId,
  });
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: ['entries', id],
    queryFn: () => entriesApi.get(id),
    enabled: !!id,
  });
}

export function useSimulateEntry(journalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SimulateEntryDto) => entriesApi.simulate(journalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'entries'] });
    },
  });
}

/**
 * Create an entry via web upload (FREE - no SMS limits)
 */
export function useCreateEntry(journalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWebEntryDto) => entriesApi.create(journalId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'entries'] });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { is_hidden?: boolean; is_pinned?: boolean } }) =>
      entriesApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['entries', id] });
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => entriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
    },
  });
}
