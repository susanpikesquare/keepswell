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

// ---- In-app prompts feed (participant-facing) -------------------------

/**
 * Pending in-app prompts for the signed-in user across all journals.
 * Stale-while-revalidate at 1 minute — the feed should feel fresh but the
 * tab is also re-invalidated whenever a prompt is answered/dismissed.
 */
export function useInAppPromptFeed() {
  const { getToken } = useAuth();
  if (getToken) setGetTokenFn(getToken);

  return useQuery({
    queryKey: ['prompts', 'in-app-feed'],
    queryFn: () => promptsApi.getInAppFeed(),
    staleTime: 1000 * 60,
  });
}

/** Marks one prompt as responded; invalidates the feed so it disappears. */
export function useMarkPromptResponded() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  if (getToken) setGetTokenFn(getToken);

  return useMutation({
    mutationFn: (promptSendId: string) => promptsApi.markPromptResponded(promptSendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'in-app-feed'] });
    },
  });
}

// ---- Owner: manage upcoming prompts -----------------------------------

export function useUpcomingPrompts(journalId: string) {
  const { getToken } = useAuth();
  if (getToken) setGetTokenFn(getToken);

  return useQuery({
    queryKey: ['prompts', 'upcoming', journalId],
    queryFn: () => promptsApi.getUpcomingPrompts(journalId),
    enabled: !!journalId,
    staleTime: 1000 * 30,
  });
}

export function useAddUpcomingPrompt() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  if (getToken) setGetTokenFn(getToken);

  return useMutation({
    mutationFn: ({
      journalId,
      body,
    }: {
      journalId: string;
      body: { text: string; scheduledFor: string; category?: string };
    }) => promptsApi.addUpcomingPrompt(journalId, body),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'upcoming', journalId] });
    },
  });
}

export function useEditUpcomingPrompt() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  if (getToken) setGetTokenFn(getToken);

  return useMutation({
    mutationFn: ({
      scheduledPromptId,
      body,
    }: {
      scheduledPromptId: string;
      // journalId is only used to invalidate; not sent in body
      journalId: string;
      body: { text?: string; scheduledFor?: string };
    }) => promptsApi.editUpcomingPrompt(scheduledPromptId, body),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'upcoming', journalId] });
    },
  });
}

export function useCancelUpcomingPrompt() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  if (getToken) setGetTokenFn(getToken);

  return useMutation({
    mutationFn: ({
      scheduledPromptId,
    }: {
      scheduledPromptId: string;
      journalId: string;
    }) => promptsApi.cancelUpcomingPrompt(scheduledPromptId),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: ['prompts', 'upcoming', journalId] });
    },
  });
}
