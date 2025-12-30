import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { participantsApi } from '../api';
import type { InviteParticipantDto } from '../types';

export function useParticipants(journalId: string) {
  return useQuery({
    queryKey: ['journals', journalId, 'participants'],
    queryFn: () => participantsApi.list(journalId),
    enabled: !!journalId,
  });
}

export function useInviteParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ journalId, data }: { journalId: string; data: InviteParticipantDto }) =>
      participantsApi.invite(journalId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'participants'] });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      journalId: string;
      data: Partial<{ display_name: string; status: string }>;
    }) => participantsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; journalId: string }) =>
      participantsApi.remove(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
    },
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: (id: string) => participantsApi.resendInvite(id),
  });
}
