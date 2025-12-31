import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { participantsApi, setAuthToken } from '../api';
import type { InviteParticipantDto } from '../types';

export function useParticipants(journalId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['journals', journalId, 'participants'],
    queryFn: async () => {
      const token = await getToken();
      setAuthToken(token);
      return participantsApi.list(journalId);
    },
    enabled: !!journalId,
  });
}

export function useInviteParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ journalId, data }: { journalId: string; data: InviteParticipantDto }) => {
      const token = await getToken();
      setAuthToken(token);
      return participantsApi.invite(journalId, data);
    },
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'participants'] });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      journalId: string;
      data: Partial<{ display_name: string; status: string }>;
    }) => {
      const token = await getToken();
      setAuthToken(token);
      return participantsApi.update(id, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ id }: { id: string; journalId: string }) => {
      const token = await getToken();
      setAuthToken(token);
      return participantsApi.remove(id);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
    },
  });
}

export function useResendInvite() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      setAuthToken(token);
      return participantsApi.resendInvite(id);
    },
  });
}
