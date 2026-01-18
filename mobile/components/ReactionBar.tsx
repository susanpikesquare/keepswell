import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { useEntryReactions, useToggleReaction } from '../hooks/useReactions';
import { REACTION_EMOJI_MAP, ALLOWED_REACTIONS } from '../api/types';
import type { ReactionType } from '../api/types';

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
      <View style={styles.container}>
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  const reactions = reactionsData?.reactions || {};
  const hasReactions = Object.keys(reactions).length > 0;

  return (
    <View style={styles.container}>
      {/* Existing reactions */}
      <View style={styles.reactionsRow}>
        {/* Empty state hint */}
        {!hasReactions && (
          <Text style={styles.hintText}>React to this memory</Text>
        )}

        {Object.entries(reactions).map(([emoji, data]) => (
          <TouchableOpacity
            key={emoji}
            onPress={() => handleReaction(emoji as ReactionType)}
            disabled={toggleReaction.isPending}
            style={[
              styles.reactionBadge,
              compact && styles.reactionBadgeCompact,
              toggleReaction.isPending && styles.reactionBadgeDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.reactionEmoji, compact && styles.reactionEmojiCompact]}>
              {REACTION_EMOJI_MAP[emoji as ReactionType] || emoji}
            </Text>
            <Text style={[styles.reactionCount, compact && styles.reactionCountCompact]}>
              {data.count}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Add reaction button */}
        <TouchableOpacity
          onPress={() => setShowPicker(true)}
          style={[
            styles.addReactionButton,
            compact && styles.addReactionButtonCompact,
            !hasReactions && styles.addReactionButtonWithLabel,
          ]}
          activeOpacity={0.7}
        >
          <FontAwesome
            name="smile-o"
            size={compact ? 14 : 16}
            color="#666"
          />
          {!hasReactions && !compact && (
            <Text style={styles.addButtonLabel}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Reaction Picker Modal */}
      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPicker(false)}
        >
          <View style={styles.pickerContainer}>
            {/* Picker header */}
            <Text style={styles.pickerTitle}>Choose a reaction</Text>
            <View style={styles.picker}>
              {toggleReaction.isPending && (
                <View style={styles.pickerLoading}>
                  <ActivityIndicator size="small" color="#6366f1" />
                </View>
              )}
              {ALLOWED_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => handleReaction(emoji)}
                  disabled={toggleReaction.isPending}
                  style={[
                    styles.pickerEmoji,
                    toggleReaction.isPending && styles.pickerEmojiDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.pickerEmojiText}>
                    {REACTION_EMOJI_MAP[emoji]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
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
    height: 28,
    width: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 14,
  },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginRight: 4,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  reactionBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionBadgeDisabled: {
    opacity: 0.5,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionEmojiCompact: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  reactionCountCompact: {
    fontSize: 12,
  },
  addReactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    gap: 6,
  },
  addReactionButtonCompact: {
    width: 26,
    height: 26,
    paddingHorizontal: 0,
    borderRadius: 13,
  },
  addReactionButtonWithLabel: {
    paddingHorizontal: 14,
  },
  addButtonLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 12,
  },
  picker: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  pickerLoading: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pickerEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerEmojiDisabled: {
    opacity: 0.5,
  },
  pickerEmojiText: {
    fontSize: 30,
  },
});
