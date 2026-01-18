import { useState } from 'react';
import { MessageCircle, Send, CornerDownRight, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useEntryComments, useCreateComment, useDeleteComment } from '../../hooks/useComments';
import type { CommentWithReplies } from '../../api/comments';

interface CommentSectionProps {
  entryId: string;
  journalId?: string;
  compact?: boolean;
}

export function CommentSection({ entryId, journalId, compact = false }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: commentsData, isLoading } = useEntryComments(entryId);
  const createComment = useCreateComment(entryId, journalId);

  const comments = commentsData?.comments || [];
  const total = commentsData?.total || 0;

  if (isLoading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Toggle button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        <span>
          {total === 0
            ? 'Add a comment'
            : `${total} comment${total !== 1 ? 's' : ''}`}
        </span>
        {total > 0 && (
          isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {/* Expanded section */}
      {(isExpanded || total === 0) && (
        <div className="mt-3 space-y-3">
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
            <div className="space-y-2 mt-4">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  entryId={entryId}
                  journalId={journalId}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  isPending: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}

function CommentForm({ onSubmit, isPending, placeholder, autoFocus }: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isPending) return;

    await onSubmit(content.trim());
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isPending}
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={!content.trim() || isPending}
        className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}

interface CommentThreadProps {
  comment: CommentWithReplies;
  entryId: string;
  journalId?: string;
  compact?: boolean;
}

function CommentThread({ comment, entryId, journalId, compact }: CommentThreadProps) {
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

  return (
    <div className={`${indent > 0 ? 'ml-4 pl-3 border-l-2 border-gray-100' : ''}`}>
      <div className="bg-gray-50 rounded-lg p-3">
        {/* Comment header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-xs font-medium text-indigo-600">
                {comment.participant?.display_name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700">
              {comment.participant?.display_name || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-400">
              {formatDate(comment.created_at)}
            </span>
          </div>
          <button
            onClick={() => deleteComment.mutate(comment.id)}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete comment"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>

        {/* Comment content */}
        <p className="text-sm text-gray-700">{comment.content}</p>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <CornerDownRight className="h-3 w-3" />
            Reply
          </button>
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies.length} repl{comment.replies.length === 1 ? 'y' : 'ies'}
            </button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="mt-2 ml-4">
          <CommentForm
            onSubmit={async (content) => {
              await createComment.mutateAsync({ content, parent_id: comment.id });
              setShowReplyForm(false);
            }}
            isPending={createComment.isPending}
            placeholder={`Reply to ${comment.participant?.display_name || 'Anonymous'}...`}
            autoFocus
          />
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && showReplies && (
        <div className="mt-2 space-y-2">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              entryId={entryId}
              journalId={journalId}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { CommentForm, CommentThread };
