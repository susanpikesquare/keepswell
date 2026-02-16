import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import {
  useJournalPrompts,
  useUpdatePromptOrder,
  useResetPromptOrder,
  useCreateJournalPrompt,
  useUpdateJournalPrompt,
  useDeleteJournalPrompt,
} from '../hooks/usePrompts';
import type { Prompt } from '../api';

interface PromptOrderSectionProps {
  journalId: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  memories: { bg: '#f3e8ff', text: '#7e22ce' },
  gratitude: { bg: '#dcfce7', text: '#15803d' },
  milestones: { bg: '#dbeafe', text: '#1d4ed8' },
  traditions: { bg: '#fef3c7', text: '#b45309' },
  wisdom: { bg: '#e0e7ff', text: '#4338ca' },
  stories: { bg: '#fce7f3', text: '#be185d' },
  dreams: { bg: '#cffafe', text: '#0e7490' },
  daily: { bg: '#f3f4f6', text: '#374151' },
  reflection: { bg: '#ffe4e6', text: '#be123c' },
  adventure: { bg: '#ffedd5', text: '#c2410c' },
  custom: { bg: '#ccfbf1', text: '#0f766e' },
};

const CATEGORIES = [
  'memories', 'gratitude', 'milestones', 'traditions', 'wisdom',
  'stories', 'dreams', 'daily', 'reflection', 'adventure', 'custom',
];

interface PromptFormData {
  text: string;
  category: string;
  is_starter: boolean;
  is_deep: boolean;
  requires_photo: boolean;
}

const DEFAULT_FORM_DATA: PromptFormData = {
  text: '',
  category: 'custom',
  is_starter: false,
  is_deep: false,
  requires_photo: false,
};

export function PromptOrderSection({ journalId }: PromptOrderSectionProps) {
  const { data: prompts, isLoading } = useJournalPrompts(journalId);
  const updateOrder = useUpdatePromptOrder();
  const resetOrder = useResetPromptOrder();
  const createPrompt = useCreateJournalPrompt();
  const updatePrompt = useUpdateJournalPrompt();
  const deletePrompt = useDeleteJournalPrompt();

  const [localPrompts, setLocalPrompts] = useState<Prompt[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromptFormData>(DEFAULT_FORM_DATA);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (prompts) {
      setLocalPrompts(prompts);
      setHasChanges(false);
    }
  }, [prompts]);

  const movePrompt = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localPrompts.length) return;
    const newPrompts = [...localPrompts];
    [newPrompts[index], newPrompts[newIndex]] = [newPrompts[newIndex], newPrompts[index]];
    setLocalPrompts(newPrompts);
    setHasChanges(true);
  };

  const handleSaveOrder = async () => {
    const promptIds = localPrompts.map(p => p.id);
    await updateOrder.mutateAsync({ journalId, promptIds });
    setHasChanges(false);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Prompt Order',
      'This will reset prompts to the default order. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await resetOrder.mutateAsync(journalId);
            setHasChanges(false);
          },
        },
      ]
    );
  };

  const handleAddPrompt = () => {
    setFormData(DEFAULT_FORM_DATA);
    setShowAddForm(true);
    setEditingPromptId(null);
    setShowCategoryPicker(false);
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setFormData({
      text: prompt.text,
      category: prompt.category || 'custom',
      is_starter: prompt.is_starter || false,
      is_deep: prompt.is_deep || false,
      requires_photo: prompt.requires_photo || false,
    });
    setEditingPromptId(prompt.id);
    setShowAddForm(false);
    setShowCategoryPicker(false);
  };

  const handleCancelEdit = () => {
    setEditingPromptId(null);
    setShowAddForm(false);
    setFormData(DEFAULT_FORM_DATA);
    setShowCategoryPicker(false);
  };

  const handleSavePrompt = async () => {
    if (!formData.text.trim()) return;

    try {
      if (editingPromptId) {
        await updatePrompt.mutateAsync({
          journalId,
          promptId: editingPromptId,
          data: formData,
        });
      } else {
        await createPrompt.mutateAsync({
          journalId,
          data: formData,
        });
      }
      handleCancelEdit();
    } catch {
      Alert.alert('Error', 'Failed to save prompt.');
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await deletePrompt.mutateAsync({ journalId, promptId });
      setDeleteConfirmId(null);
    } catch {
      Alert.alert('Error', 'Failed to delete prompt.');
    }
  };

  const getCategoryStyle = (category: string | null) => {
    const colors = CATEGORY_COLORS[category || 'daily'] || CATEGORY_COLORS.daily;
    return { backgroundColor: colors.bg, color: colors.text };
  };

  const renderPromptForm = (isEditing: boolean = false) => (
    <View style={styles.formContainer}>
      <Text style={styles.formLabel}>Prompt Text</Text>
      <TextInput
        style={styles.formTextArea}
        value={formData.text}
        onChangeText={(text) => setFormData({ ...formData, text })}
        placeholder="Enter your prompt question..."
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      <Text style={[styles.formLabel, { marginTop: 12 }]}>Category</Text>
      <TouchableOpacity
        style={styles.categoryPickerButton}
        onPress={() => setShowCategoryPicker(!showCategoryPicker)}
      >
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryStyle(formData.category).backgroundColor }]}>
          <Text style={{ color: getCategoryStyle(formData.category).color, fontSize: 13, fontWeight: '500' }}>
            {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
          </Text>
        </View>
        <FontAwesome name={showCategoryPicker ? 'chevron-up' : 'chevron-down'} size={12} color="#666" />
      </TouchableOpacity>
      {showCategoryPicker && (
        <View style={styles.categoryList}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryOption, formData.category === cat && styles.categoryOptionSelected]}
              onPress={() => { setFormData({ ...formData, category: cat }); setShowCategoryPicker(false); }}
            >
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryStyle(cat).backgroundColor }]}>
                <Text style={{ color: getCategoryStyle(cat).color, fontSize: 13 }}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </View>
              {formData.category === cat && <FontAwesome name="check" size={14} color="#6366f1" />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Starter prompt</Text>
        <Switch
          value={formData.is_starter}
          onValueChange={(v) => setFormData({ ...formData, is_starter: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Deep/reflective</Text>
        <Switch
          value={formData.is_deep}
          onValueChange={(v) => setFormData({ ...formData, is_deep: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Photo prompt</Text>
        <Switch
          value={formData.requires_photo}
          onValueChange={(v) => setFormData({ ...formData, requires_photo: v })}
          trackColor={{ true: '#6366f1' }}
        />
      </View>

      <View style={styles.formActions}>
        <TouchableOpacity style={styles.formCancelButton} onPress={handleCancelEdit}>
          <Text style={styles.formCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.formSaveButton, !formData.text.trim() && { opacity: 0.4 }]}
          onPress={handleSavePrompt}
          disabled={!formData.text.trim() || createPrompt.isPending || updatePrompt.isPending}
        >
          {(createPrompt.isPending || updatePrompt.isPending) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.formSaveText}>{isEditing ? 'Save Changes' : 'Add Prompt'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  return (
    <View>
      {/* Add prompt button */}
      {!showAddForm ? (
        <TouchableOpacity style={styles.addButton} onPress={handleAddPrompt}>
          <FontAwesome name="plus" size={14} color="#6366f1" />
          <Text style={styles.addButtonText}>Add Custom Prompt</Text>
        </TouchableOpacity>
      ) : (
        renderPromptForm(false)
      )}

      {/* Prompts list */}
      {localPrompts.length === 0 ? (
        <Text style={styles.emptyText}>No prompts available. Add a custom prompt above.</Text>
      ) : (
        <View style={styles.promptList}>
          {localPrompts.map((prompt, index) => (
            <View key={prompt.id}>
              {editingPromptId === prompt.id ? (
                renderPromptForm(true)
              ) : (
                <View style={[styles.promptItem, prompt.is_custom && styles.promptItemCustom]}>
                  {/* Reorder buttons */}
                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      onPress={() => movePrompt(index, 'up')}
                      disabled={index === 0}
                      style={[styles.reorderButton, index === 0 && { opacity: 0.3 }]}
                    >
                      <FontAwesome name="chevron-up" size={10} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.orderNumber}>#{index + 1}</Text>
                    <TouchableOpacity
                      onPress={() => movePrompt(index, 'down')}
                      disabled={index === localPrompts.length - 1}
                      style={[styles.reorderButton, index === localPrompts.length - 1 && { opacity: 0.3 }]}
                    >
                      <FontAwesome name="chevron-down" size={10} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Prompt content */}
                  <View style={styles.promptContent}>
                    <Text style={styles.promptText} numberOfLines={2}>{prompt.text}</Text>
                    <View style={styles.badgeRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: getCategoryStyle(prompt.category).backgroundColor }]}>
                        <Text style={{ color: getCategoryStyle(prompt.category).color, fontSize: 11 }}>
                          {prompt.category || 'general'}
                        </Text>
                      </View>
                      {prompt.is_custom && (
                        <View style={[styles.categoryBadge, { backgroundColor: '#ccfbf1' }]}>
                          <Text style={{ color: '#0f766e', fontSize: 11 }}>custom</Text>
                        </View>
                      )}
                      {prompt.is_starter && (
                        <View style={[styles.categoryBadge, { backgroundColor: '#dcfce7' }]}>
                          <Text style={{ color: '#15803d', fontSize: 11 }}>starter</Text>
                        </View>
                      )}
                      {prompt.is_deep && (
                        <View style={[styles.categoryBadge, { backgroundColor: '#ede9fe' }]}>
                          <Text style={{ color: '#6d28d9', fontSize: 11 }}>deep</Text>
                        </View>
                      )}
                      {prompt.requires_photo && (
                        <View style={[styles.categoryBadge, { backgroundColor: '#e0f2fe' }]}>
                          <Text style={{ color: '#0369a1', fontSize: 11 }}>photo</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Action buttons (only for custom prompts) */}
                  {prompt.is_custom && (
                    <View style={styles.actionButtons}>
                      {deleteConfirmId === prompt.id ? (
                        <View style={styles.deleteConfirmRow}>
                          <TouchableOpacity
                            style={styles.deleteConfirmButton}
                            onPress={() => handleDeletePrompt(prompt.id)}
                            disabled={deletePrompt.isPending}
                          >
                            {deletePrompt.isPending ? (
                              <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                              <FontAwesome name="check" size={12} color="#ef4444" />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteConfirmButton}
                            onPress={() => setDeleteConfirmId(null)}
                          >
                            <FontAwesome name="times" size={12} color="#666" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEditPrompt(prompt)}
                          >
                            <FontAwesome name="pencil" size={12} color="#666" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => setDeleteConfirmId(prompt.id)}
                          >
                            <FontAwesome name="trash-o" size={12} color="#ef4444" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleReset}
          disabled={resetOrder.isPending}
        >
          {resetOrder.isPending ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <>
              <FontAwesome name="undo" size={12} color="#666" />
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </>
          )}
        </TouchableOpacity>

        {hasChanges && (
          <TouchableOpacity
            style={styles.saveOrderButton}
            onPress={handleSaveOrder}
            disabled={updateOrder.isPending}
          >
            {updateOrder.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveOrderText}>Save Order</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  emptyText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 16,
  },
  promptList: {
    gap: 8,
  },
  promptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 12,
    gap: 10,
  },
  promptItemCustom: {
    borderColor: '#99f6e4',
  },
  reorderButtons: {
    alignItems: 'center',
    gap: 2,
  },
  reorderButton: {
    padding: 4,
  },
  orderNumber: {
    fontSize: 11,
    color: '#aaa',
  },
  promptContent: {
    flex: 1,
  },
  promptText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  actionButtons: {
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
  deleteConfirmRow: {
    flexDirection: 'row',
    gap: 2,
  },
  deleteConfirmButton: {
    padding: 6,
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  resetButtonText: {
    fontSize: 13,
    color: '#666',
  },
  saveOrderButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveOrderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  formContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  formTextArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 72,
  },
  categoryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginTop: 4,
    overflow: 'hidden',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryOptionSelected: {
    backgroundColor: '#f5f3ff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  switchLabel: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
  formCancelButton: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  formCancelText: {
    fontSize: 14,
    color: '#666',
  },
  formSaveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  formSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
