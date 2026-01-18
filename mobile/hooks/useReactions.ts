import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { reactionsApi, setGetTokenFn } from '../api';
import type { CreateReactionDto, ReactionType } from '../api';

/**
 * Get reactions for an entry
 */
export function useEntryReactions(entryId: string) {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['entries', entryId, 'reactions'],
    queryFn: () => reactionsApi.list(entryId),
    enabled: !!entryId,
  });
}

/**
 * Add a reaction to an entry
 */
export function useAddReaction(entryId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (data: CreateReactionDto) => reactionsApi.create(entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'reactions'] });
    },
  });
}

/**
 * Toggle a reaction on an entry (add if not present, remove if present)
 */
export function useToggleReaction(entryId: string, journalId?: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (data: CreateReactionDto) => reactionsApi.toggle(entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'reactions'] });
      // Also invalidate the entries list to update reaction counts
      if (journalId) {
        queryClient.invalidateQueries({ queryKey: ['journal-entries', journalId] });
      }
    },
  });
}

/**
 * Remove a reaction from an entry
 */
export function useRemoveReaction(entryId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ emoji, participantId }: { emoji: ReactionType; participantId?: string }) =>
      reactionsApi.remove(entryId, emoji, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'reactions'] });
    },
  });
}
