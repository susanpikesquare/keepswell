import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useEntryComments, useCreateComment, useDeleteComment } from '../hooks/useComments';
import type { CommentWithReplies } from '../api/comments';

interface CommentSectionProps {
  entryId: string;
  journalId?: string;
}

export function CommentSection({ entryId, journalId }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: commentsData, isLoading } = useEntryComments(entryId);
  const createComment = useCreateComment(entryId, journalId);

  const comments = commentsData?.comments || [];
  const total = commentsData?.total || 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toggle button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <FontAwesome name="comment-o" size={14} color="#666" />
        <Text style={styles.toggleText}>
          {total === 0 ? 'Add a comment' : `${total} comment${total !== 1 ? 's' : ''}`}
        </Text>
        {total > 0 && (
          <FontAwesome
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={12}
            color="#666"
          />
        )}
      </TouchableOpacity>

      {/* Expanded section */}
      {(isExpanded || total === 0) && (
        <View style={styles.expandedSection}>
          {/* Comment form */}
          <CommentForm
            onSubmit={async (content) => {
              await createComment.mutateAsync({ content });
            }}
            isPending={createComment.isPending}
            placeholder="Write a comment..."
          />

          {/* Comments list */}
          {comments.length > 0 && (
            <View style={styles.commentsList}>
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  entryId={entryId}
                  journalId={journalId}
                />
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isPending: boolean;
  placeholder?: string;
}

function CommentForm({ onSubmit, isPending, placeholder }: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async () => {
    if (!content.trim() || isPending) return;

    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    }
  };

  return (
    <View style={styles.formContainer}>
      <TextInput
        style={styles.input}
        value={content}
        onChangeText={setContent}
        placeholder={placeholder}
        placeholderTextColor="#999"
        multiline
        editable={!isPending}
      />
      <TouchableOpacity
        style={[
          styles.submitButton,
          (!content.trim() || isPending) && styles.submitButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!content.trim() || isPending}
        activeOpacity={0.7}
      >
        {isPending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <FontAwesome name="send" size={14} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

interface CommentThreadProps {
  comment: CommentWithReplies;
  entryId: string;
  journalId?: string;
}

function CommentThread({ comment, entryId, journalId }: CommentThreadProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(comment.depth < 2);
  const createComment = useCreateComment(entryId, journalId);
  const deleteComment = useDeleteComment(entryId);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const maxIndent = 4;
  const indent = Math.min(comment.depth, maxIndent);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteComment.mutate(comment.id),
        },
      ]
    );
  };

  return (
    <View style={[styles.threadContainer, indent > 0 && styles.indentedThread]}>
      <View style={styles.commentCard}>
        {/* Comment header */}
        <View style={styles.commentHeader}>
          <View style={styles.authorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {comment.participant?.display_name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={styles.authorName}>
              {comment.participant?.display_name || 'Anonymous'}
            </Text>
            <Text style={styles.timestamp}>{formatDate(comment.created_at)}</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <FontAwesome name="trash-o" size={12} color="#999" />
          </TouchableOpacity>
        </View>

        {/* Comment content */}
        <Text style={styles.commentContent}>{comment.content}</Text>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowReplyForm(!showReplyForm)}
          >
            <FontAwesome name="reply" size={12} color="#666" />
            <Text style={styles.actionText}>Reply</Text>
          </TouchableOpacity>
          {hasReplies && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowReplies(!showReplies)}
            >
              <Text style={styles.actionText}>
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                {comment.replies.length === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Reply form */}
      {showReplyForm && (
        <View style={styles.replyFormContainer}>
          <CommentForm
            onSubmit={async (content) => {
              await createComment.mutateAsync({ content, parent_id: comment.id });
              setShowReplyForm(false);
            }}
            isPending={createComment.isPending}
            placeholder={`Reply to ${comment.participant?.display_name || 'Anonymous'}...`}
          />
        </View>
      )}

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              entryId={entryId}
              journalId={journalId}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loadingPlaceholder: {
    height: 32,
    width: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    color: '#666',
  },
  expandedSection: {
    marginTop: 12,
  },
  formContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    minHeight: 40,
    maxHeight: 100,
  },
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  commentsList: {
    marginTop: 16,
    gap: 8,
  },
  threadContainer: {},
  indentedThread: {
    marginLeft: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
  },
  commentCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
  },
  authorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  deleteButton: {
    padding: 4,
  },
  commentContent: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
  },
  replyFormContainer: {
    marginTop: 8,
    marginLeft: 16,
  },
  repliesContainer: {
    marginTop: 8,
    gap: 8,
  },
});

export { CommentForm, CommentThread };
