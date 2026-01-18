import apiClient from './client';

export interface Comment {
  id: string;
  entry_id: string;
  participant_id: string;
  parent_id: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  participant?: {
    id: string;
    display_name: string;
  };
}

export interface CommentWithReplies extends Comment {
  replies: CommentWithReplies[];
  depth: number;
}

export interface EntryComments {
  entry_id: string;
  comments: CommentWithReplies[];
  total: number;
}

export interface CreateCommentDto {
  content: string;
  parent_id?: string;
}

export interface UpdateCommentDto {
  content?: string;
  is_hidden?: boolean;
}

export const commentsApi = {
  list: async (entryId: string): Promise<EntryComments> => {
    const response = await apiClient.get(`/entries/${entryId}/comments`);
    return response.data;
  },

  create: async (entryId: string, data: CreateCommentDto): Promise<Comment> => {
    const response = await apiClient.post(`/entries/${entryId}/comments`, data);
    return response.data;
  },

  get: async (commentId: string): Promise<Comment> => {
    const response = await apiClient.get(`/comments/${commentId}`);
    return response.data;
  },

  update: async (commentId: string, data: UpdateCommentDto): Promise<Comment> => {
    const response = await apiClient.patch(`/comments/${commentId}`, data);
    return response.data;
  },

  delete: async (commentId: string): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
