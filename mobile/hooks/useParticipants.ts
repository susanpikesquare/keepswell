import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { participantsApi, paymentsApi, setGetTokenFn } from '../api';
import type { InviteParticipantDto } from '../api';

export function useParticipants(journalId: string) {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journals', journalId, 'participants'],
    queryFn: () => participantsApi.list(journalId),
    enabled: !!journalId,
  });
}

export function useInviteParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ journalId, data }: { journalId: string; data: InviteParticipantDto }) =>
      participantsApi.invite(journalId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['journal', journalId] });
    },
  });
}

export function useUpdateParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

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
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ id }: { id: string; journalId: string }) =>
      participantsApi.remove(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
      queryClient.invalidateQueries({ queryKey: ['journal', variables.journalId] });
    },
  });
}

export function useResendInvite() {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (id: string) => participantsApi.resendInvite(id),
  });
}

export function useApproveParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ id }: { id: string; journalId: string }) =>
      participantsApi.approve(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
    },
  });
}

export function useDeclineParticipant() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ id }: { id: string; journalId: string }) =>
      participantsApi.decline(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['journals', variables.journalId, 'participants'] });
    },
  });
}

export function useUsageLimits() {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['usage-limits'],
    queryFn: () => paymentsApi.getUsageLimits(),
  });
}
