import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reactionsApi } from '../api';
import type { CreateReactionDto } from '../api';
import type { ReactionType } from '../types';

/**
 * Get reactions for an entry
 */
export function useEntryReactions(entryId: string) {
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

  return useMutation({
    mutationFn: (data: CreateReactionDto) => reactionsApi.toggle(entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'reactions'] });
      // Also invalidate the entries list to update reaction counts
      if (journalId) {
        queryClient.invalidateQueries({ queryKey: ['journals', journalId, 'entries'] });
      }
    },
  });
}

/**
 * Remove a reaction from an entry
 */
export function useRemoveReaction(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ emoji, participantId }: { emoji: ReactionType; participantId?: string }) =>
      reactionsApi.remove(entryId, emoji, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'reactions'] });
    },
  });
}
