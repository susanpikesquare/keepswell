import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import {
  useUpcomingPrompts,
  useAddUpcomingPrompt,
  useEditUpcomingPrompt,
  useCancelUpcomingPrompt,
} from '../hooks';
import type { UpcomingPromptItem } from '../api/prompts';

/**
 * Owner-facing manager for the journal's upcoming prompt queue.
 *
 * Shows each pending/sent prompt with its scheduled time, lets the owner
 * edit the text inline, cancel an upcoming send, or add a brand-new custom
 * prompt to the schedule. Sent/cancelled rows are read-only.
 *
 * The component is intentionally self-contained (its own hooks + state) so
 * it can be dropped into JournalSettingsModal without entangling that file
 * with additional concerns.
 */
export function UpcomingPromptsSection({ journalId }: { journalId: string }) {
  const { data, isLoading, error, refetch } = useUpcomingPrompts(journalId);
  const addPrompt = useAddUpcomingPrompt();
  const cancelPrompt = useCancelUpcomingPrompt();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newPromptText, setNewPromptText] = useState('');

  const items = data ?? [];
  const pending = items.filter((p) => p.status === 'pending');
  const recent = items.filter((p) => p.status !== 'pending').slice(0, 3);

  const handleAdd = async () => {
    const text = newPromptText.trim();
    if (!text) {
      Alert.alert('Prompt text required', 'Please enter some prompt text.');
      return;
    }
    // Default schedule: 7 days from now at 9am local. The owner can change
    // it from "Prompt Schedule" elsewhere in settings; this section is for
    // managing the queue contents, not the cadence.
    const when = new Date();
    when.setDate(when.getDate() + 7);
    when.setHours(9, 0, 0, 0);
    try {
      await addPrompt.mutateAsync({
        journalId,
        body: { text, scheduledFor: when.toISOString() },
      });
      setNewPromptText('');
      setShowAddForm(false);
    } catch (err) {
      Alert.alert('Failed to add prompt', (err as Error).message || 'Please try again.');
    }
  };

  const handleCancel = (item: UpcomingPromptItem) => {
    Alert.alert(
      'Cancel prompt?',
      "This prompt won't be sent. You can add another in its place.",
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel prompt',
          style: 'destructive',
          onPress: () =>
            cancelPrompt.mutate({ scheduledPromptId: item.scheduledPromptId, journalId }),
        },
      ],
    );
  };

  if (isLoading) {
    return <ActivityIndicator color="#D86F5C" style={{ marginVertical: 12 }} />;
  }

  if (error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>Couldn't load upcoming prompts.</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.errorRetry}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      {pending.length === 0 && !showAddForm ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No prompts in the queue. Add one to get started.
          </Text>
        </View>
      ) : null}

      {pending.map((item) => (
        <UpcomingPromptRow
          key={item.scheduledPromptId}
          item={item}
          journalId={journalId}
          onCancel={() => handleCancel(item)}
        />
      ))}

      {recent.length > 0 ? (
        <>
          <Text style={styles.recentHeading}>Recently sent</Text>
          {recent.map((item) => (
            <View key={item.scheduledPromptId} style={styles.recentRow}>
              <Text style={styles.recentText} numberOfLines={2}>
                {item.text ?? '(empty)'}
              </Text>
              <Text style={styles.recentMeta}>
                {item.status === 'cancelled'
                  ? 'Cancelled'
                  : item.sentAt
                    ? `Sent ${formatDate(item.sentAt)}`
                    : item.status}
              </Text>
            </View>
          ))}
        </>
      ) : null}

      {showAddForm ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.addInput}
            value={newPromptText}
            onChangeText={setNewPromptText}
            placeholder="What would you like to ask?"
            placeholderTextColor="#999"
            multiline
            autoFocus
          />
          <View style={styles.addFormActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowAddForm(false);
                setNewPromptText('');
              }}
              disabled={addPrompt.isPending}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, addPrompt.isPending && styles.saveBtnDisabled]}
              onPress={handleAdd}
              disabled={addPrompt.isPending}
            >
              {addPrompt.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Add prompt</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addCta}
          onPress={() => setShowAddForm(true)}
          activeOpacity={0.8}
        >
          <FontAwesome name="plus-circle" size={16} color="#D86F5C" />
          <Text style={styles.addCtaText}>Add custom prompt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function UpcomingPromptRow({
  item,
  journalId,
  onCancel,
}: {
  item: UpcomingPromptItem;
  journalId: string;
  onCancel: () => void;
}) {
  const editPrompt = useEditUpcomingPrompt();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text ?? '');

  const handleSave = async () => {
    const text = draft.trim();
    if (!text) {
      Alert.alert('Prompt text required');
      return;
    }
    try {
      await editPrompt.mutateAsync({
        scheduledPromptId: item.scheduledPromptId,
        journalId,
        body: { text },
      });
      setEditing(false);
    } catch (err) {
      Alert.alert('Failed to save', (err as Error).message || 'Please try again.');
    }
  };

  return (
    <View style={styles.row}>
      {editing ? (
        <>
          <TextInput
            style={styles.editInput}
            value={draft}
            onChangeText={setDraft}
            multiline
            autoFocus
          />
          <View style={styles.rowActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setEditing(false);
                setDraft(item.text ?? '');
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, editPrompt.isPending && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={editPrompt.isPending}
            >
              {editPrompt.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.rowHeader}>
            <Text style={styles.rowDate}>
              {formatDate(item.scheduledFor)}
            </Text>
            {item.isCustom ? (
              <View style={styles.customPill}>
                <Text style={styles.customPillText}>Custom</Text>
              </View>
            ) : null}
            {item.category ? (
              <Text style={styles.rowCategory}>{item.category}</Text>
            ) : null}
          </View>
          <Text style={styles.rowText}>{item.text ?? '(empty)'}</Text>
          <View style={styles.rowActions}>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.rowActionBtn}>
              <FontAwesome name="pencil" size={12} color="#666" />
              <Text style={styles.rowActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onCancel} style={styles.rowActionBtn}>
              <FontAwesome name="times" size={12} color="#ef4444" />
              <Text style={[styles.rowActionText, { color: '#ef4444' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  rowDate: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customPill: {
    backgroundColor: '#F6F1EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  customPillText: {
    fontSize: 10,
    color: '#D86F5C',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rowCategory: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    textTransform: 'capitalize',
  },
  rowText: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 21,
    marginBottom: 10,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  rowActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  rowActionText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  editInput: {
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 60,
    textAlignVertical: 'top',
    padding: 8,
    backgroundColor: '#fafafa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 8,
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
  },
  errorBox: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
  },
  errorText: { color: '#666', fontSize: 13 },
  errorRetry: { color: '#D86F5C', fontWeight: '600' },
  addCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 4,
    backgroundColor: '#F6F1EA',
    borderRadius: 10,
  },
  addCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D86F5C',
  },
  addForm: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fafafa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  addInput: {
    fontSize: 15,
    color: '#1a1a1a',
    minHeight: 80,
    textAlignVertical: 'top',
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  addFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  cancelBtnText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#D86F5C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 100,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#F5C9BF',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  recentHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 6,
  },
  recentRow: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  recentText: {
    fontSize: 13,
    color: '#999',
  },
  recentMeta: {
    fontSize: 11,
    color: '#bbb',
    marginTop: 2,
  },
});
