import { useState } from 'react';
import { Smile } from 'lucide-react';
import { useEntryReactions, useToggleReaction } from '../../hooks/useReactions';
import { REACTION_EMOJI_MAP, ALLOWED_REACTIONS } from '../../types';
import type { ReactionType } from '../../types';

interface ReactionBarProps {
  entryId: string;
  journalId?: string;
  compact?: boolean;
}

export function ReactionBar({ entryId, journalId, compact = false }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const { data: reactionsData, isLoading } = useEntryReactions(entryId);
  const toggleReaction = useToggleReaction(entryId, journalId);

  const handleReaction = async (emoji: ReactionType) => {
    try {
      await toggleReaction.mutateAsync({ emoji });
      setShowPicker(false);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-8">
        <div className="h-6 w-20 bg-gray-100 animate-pulse rounded-full" />
      </div>
    );
  }

  const reactions = reactionsData?.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <div className="relative flex items-center gap-2 flex-wrap">
      {/* Empty state hint */}
      {!hasReactions && (
        <span className="text-xs text-gray-400 mr-1">
          React to this memory
        </span>
      )}

      {/* Existing reactions */}
      {Object.entries(reactions).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji as ReactionType)}
          disabled={toggleReaction.isPending}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
            bg-indigo-50 hover:bg-indigo-100 border border-indigo-100
            transition-all duration-200
            ${compact ? 'text-xs px-2 py-1' : ''}
            ${toggleReaction.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
          `}
          title={`${data.participants.map(p => p.display_name).join(', ')} reacted with ${emoji}`}
        >
          <span className="text-base">{REACTION_EMOJI_MAP[emoji as ReactionType] || emoji}</span>
          <span className="text-indigo-600 font-semibold">{data.count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-gray-100 hover:bg-gray-200 transition-all duration-200
            text-gray-500 hover:text-gray-700
            ${compact ? 'px-2 py-1' : ''}
            ${showPicker ? 'bg-gray-200 ring-2 ring-indigo-300' : ''}
          `}
          title="Add a reaction"
        >
          <Smile className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}`} />
          {!hasReactions && !compact && (
            <span className="text-xs font-medium">Add</span>
          )}
        </button>

        {/* Reaction picker */}
        {showPicker && (
          <>
            {/* Backdrop to close picker */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute left-0 bottom-full mb-2 z-50">
              <ReactionPicker
                onSelect={handleReaction}
                onClose={() => setShowPicker(false)}
                isPending={toggleReaction.isPending}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface ReactionPickerProps {
  onSelect: (emoji: ReactionType) => void;
  onClose?: () => void;
  isPending?: boolean;
}

function ReactionPicker({ onSelect, isPending }: ReactionPickerProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
        <p className="text-xs font-medium text-gray-500 text-center">
          Choose a reaction
        </p>
      </div>
      {/* Emoji grid */}
      <div className="p-2 flex gap-1">
        {ALLOWED_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            disabled={isPending}
            className={`
              w-11 h-11 flex items-center justify-center rounded-xl text-2xl
              hover:bg-indigo-50 transition-all duration-150
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-125 active:scale-100'}
            `}
            title={`React with ${emoji}`}
          >
            {REACTION_EMOJI_MAP[emoji]}
          </button>
        ))}
      </div>
    </div>
  );
}

// Also export a standalone picker for use elsewhere
export { ReactionPicker };
