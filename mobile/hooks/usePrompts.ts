import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { setGetTokenFn } from '../api';
import { promptsApi } from '../api/prompts';

export function useJournalPrompts(journalId: string) {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['journal-prompts', journalId],
    queryFn: () => promptsApi.getJournalPrompts(journalId),
    enabled: !!journalId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdatePromptOrder() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ journalId, promptIds }: { journalId: string; promptIds: string[] }) =>
      promptsApi.updatePromptOrder(journalId, promptIds),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}

export function useResetPromptOrder() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (journalId: string) => promptsApi.resetPromptOrder(journalId),
    onSuccess: (_, journalId) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}

export function useCreateJournalPrompt() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({
      journalId,
      data,
    }: {
      journalId: string;
      data: {
        text: string;
        category?: string;
        is_starter?: boolean;
        is_deep?: boolean;
        requires_photo?: boolean;
      };
    }) => promptsApi.createJournalPrompt(journalId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}

export function useUpdateJournalPrompt() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({
      journalId,
      promptId,
      data,
    }: {
      journalId: string;
      promptId: string;
      data: {
        text?: string;
        category?: string;
        is_starter?: boolean;
        is_deep?: boolean;
        requires_photo?: boolean;
      };
    }) => promptsApi.updateJournalPrompt(journalId, promptId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}

export function useDeleteJournalPrompt() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ journalId, promptId }: { journalId: string; promptId: string }) =>
      promptsApi.deleteJournalPrompt(journalId, promptId),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['journal-prompts', journalId] });
    },
  });
}
