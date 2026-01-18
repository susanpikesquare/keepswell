import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { commentsApi, setGetTokenFn } from '../api';
import type { CreateCommentDto, UpdateCommentDto } from '../api/comments';

/**
 * Get comments for an entry (threaded)
 */
export function useEntryComments(entryId: string) {
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useQuery({
    queryKey: ['entries', entryId, 'comments'],
    queryFn: () => commentsApi.list(entryId),
    enabled: !!entryId,
  });
}

/**
 * Create a comment on an entry
 */
export function useCreateComment(entryId: string, journalId?: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (data: CreateCommentDto) => commentsApi.create(entryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'comments'] });
      if (journalId) {
        queryClient.invalidateQueries({ queryKey: ['journal-entries', journalId] });
      }
    },
  });
}

/**
 * Update a comment
 */
export function useUpdateComment(entryId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: UpdateCommentDto }) =>
      commentsApi.update(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'comments'] });
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment(entryId: string) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  if (getToken) {
    setGetTokenFn(getToken);
  }

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', entryId, 'comments'] });
    },
  });
}
