import { useState, useEffect } from 'react';
import { GripVertical, RotateCcw, Loader2 } from 'lucide-react';
import { useJournalPrompts, useUpdatePromptOrder, useResetPromptOrder } from '../../hooks/useTemplates';
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
};

export function PromptOrderSection({ journalId }: PromptOrderSectionProps) {
  const { data: prompts, isLoading } = useJournalPrompts(journalId);
  const updateOrder = useUpdatePromptOrder();
  const resetOrder = useResetPromptOrder();

  const [localPrompts, setLocalPrompts] = useState<Prompt[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

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

  const handleSave = async () => {
    const promptIds = localPrompts.map(p => p.id);
    await updateOrder.mutateAsync({ journalId, promptIds });
    setHasChanges(false);
  };

  const handleReset = async () => {
    await resetOrder.mutateAsync(journalId);
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!localPrompts.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No prompts available for this journal template.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
        {localPrompts.map((prompt, index) => (
          <div
            key={prompt.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              flex items-start gap-3 p-3 rounded-lg border bg-background
              cursor-grab active:cursor-grabbing
              hover:border-primary/50 transition-colors
              ${draggedIndex !== null && draggedIndex === index ? 'opacity-50 border-primary' : ''}
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

            <div className="flex-shrink-0 text-xs text-muted-foreground">
              #{index + 1}
            </div>
          </div>
        ))}
      </div>

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
            onClick={handleSave}
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
