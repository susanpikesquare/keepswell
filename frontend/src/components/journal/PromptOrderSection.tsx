import { useState, useEffect } from 'react';
import { GripVertical, RotateCcw, Loader2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import {
  useJournalPrompts,
  useUpdatePromptOrder,
  useResetPromptOrder,
  useCreateJournalPrompt,
  useUpdateJournalPrompt,
  useDeleteJournalPrompt,
} from '../../hooks/useTemplates';
import { Button } from '../ui';
import type { Prompt } from '../../types';

interface PromptOrderSectionProps {
  journalId: string;
}

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  memories: 'bg-purple-100 text-purple-700',
  gratitude: 'bg-green-100 text-green-700',
  milestones: 'bg-blue-100 text-blue-700',
  traditions: 'bg-amber-100 text-amber-700',
  wisdom: 'bg-indigo-100 text-indigo-700',
  stories: 'bg-pink-100 text-pink-700',
  dreams: 'bg-cyan-100 text-cyan-700',
  daily: 'bg-gray-100 text-gray-700',
  reflection: 'bg-rose-100 text-rose-700',
  adventure: 'bg-orange-100 text-orange-700',
  custom: 'bg-teal-100 text-teal-700',
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PromptFormData>(DEFAULT_FORM_DATA);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sync local state with fetched prompts
  useEffect(() => {
    if (prompts) {
      setLocalPrompts(prompts);
      setHasChanges(false);
    }
  }, [prompts]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newPrompts = [...localPrompts];
    const draggedItem = newPrompts[draggedIndex];
    newPrompts.splice(draggedIndex, 1);
    newPrompts.splice(index, 0, draggedItem);

    setLocalPrompts(newPrompts);
    setDraggedIndex(index);
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSaveOrder = async () => {
    const promptIds = localPrompts.map(p => p.id);
    await updateOrder.mutateAsync({ journalId, promptIds });
    setHasChanges(false);
  };

  const handleReset = async () => {
    await resetOrder.mutateAsync(journalId);
    setHasChanges(false);
  };

  const handleAddPrompt = () => {
    setFormData(DEFAULT_FORM_DATA);
    setShowAddForm(true);
    setEditingPromptId(null);
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
  };

  const handleCancelEdit = () => {
    setEditingPromptId(null);
    setShowAddForm(false);
    setFormData(DEFAULT_FORM_DATA);
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
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const handleDeletePrompt = async (promptId: string) => {
    try {
      await deletePrompt.mutateAsync({ journalId, promptId });
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const renderPromptForm = (isEditing: boolean = false) => (
    <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Prompt Text</label>
        <textarea
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          placeholder="Enter your prompt question..."
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.is_starter}
            onChange={(e) => setFormData({ ...formData, is_starter: e.target.checked })}
            className="rounded border-input"
          />
          <span>Starter prompt</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.is_deep}
            onChange={(e) => setFormData({ ...formData, is_deep: e.target.checked })}
            className="rounded border-input"
          />
          <span>Deep/reflective</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.requires_photo}
            onChange={(e) => setFormData({ ...formData, requires_photo: e.target.checked })}
            className="rounded border-input"
          />
          <span>Photo prompt</span>
        </label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancelEdit}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSavePrompt}
          disabled={!formData.text.trim() || createPrompt.isPending || updatePrompt.isPending}
        >
          {(createPrompt.isPending || updatePrompt.isPending) && (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          )}
          {isEditing ? 'Save Changes' : 'Add Prompt'}
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add prompt button */}
      {!showAddForm ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddPrompt}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Custom Prompt
        </Button>
      ) : (
        renderPromptForm(false)
      )}

      {/* Prompts list */}
      {localPrompts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No prompts available. Add a custom prompt above.
        </p>
      ) : (
        <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
          {localPrompts.map((prompt, index) => (
            <div key={prompt.id}>
              {editingPromptId === prompt.id ? (
                renderPromptForm(true)
              ) : (
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    group flex items-start gap-3 p-3 rounded-lg border bg-background
                    cursor-grab active:cursor-grabbing
                    hover:border-primary/50 transition-colors
                    ${draggedIndex !== null && draggedIndex === index ? 'opacity-50 border-primary' : ''}
                    ${prompt.is_custom ? 'border-teal-200' : ''}
                  `}
                >
                  <div className="flex-shrink-0 pt-1 text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed line-clamp-2">
                      {prompt.text}
                    </p>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${(prompt.category && CATEGORY_COLORS[prompt.category]) || 'bg-gray-100 text-gray-700'}`}>
                        {prompt.category || 'general'}
                      </span>

                      {prompt.is_custom && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                          custom
                        </span>
                      )}

                      {prompt.is_starter && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          starter
                        </span>
                      )}

                      {prompt.is_deep && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                          deep
                        </span>
                      )}

                      {prompt.requires_photo && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                          photo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1">
                    {prompt.is_custom && (
                      <>
                        {deleteConfirmId === prompt.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeletePrompt(prompt.id)}
                              disabled={deletePrompt.isPending}
                            >
                              {deletePrompt.isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleEditPrompt(prompt)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmId(prompt.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    <span className="text-xs text-muted-foreground ml-1">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={resetOrder.isPending}
        >
          {resetOrder.isPending ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-1" />
          )}
          Reset to Default
        </Button>

        {hasChanges && (
          <Button
            size="sm"
            onClick={handleSaveOrder}
            disabled={updateOrder.isPending}
          >
            {updateOrder.isPending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : null}
            Save Order
          </Button>
        )}
      </div>
    </div>
  );
}
