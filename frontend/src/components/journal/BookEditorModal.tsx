import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, ExternalLink } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { printApi, type BookEditorConfig } from '../../api/print';

interface BookEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalId: string;
  /**
   * Fired when the owner clicks "Order a printed copy". The parent is
   * expected to close this modal and open the order flow — kept as a
   * callback so the editor stays unaware of the order modal itself.
   */
  onRequestOrder?: () => void;
}

/**
 * Owner-only editor for the printed book. Lets them set a custom cover
 * title and toggle individual entries in/out, then preview the resulting
 * interior PDF. All edits save to the backend as the owner changes them
 * (title debounced), so a refresh or re-open restores exactly what they
 * were working on.
 *
 * Deliberately no "Save" button — editors that mutate on close/save tempt
 * users to close without saving. The explicit action here is "Preview",
 * which simultaneously confirms the current state looks right.
 */
export function BookEditorModal({ isOpen, onClose, journalId, onRequestOrder }: BookEditorModalProps) {
  const queryClient = useQueryClient();

  const { data: config, isLoading, isError } = useQuery<BookEditorConfig>({
    queryKey: ['print', 'book-config', journalId],
    queryFn: () => printApi.getBookConfig(journalId),
    // Only fetch while the modal is open — reduces load on the heavy
    // GET (which also returns every entry) and guarantees the modal
    // shows the current state when it reopens after an edit elsewhere.
    enabled: isOpen,
    staleTime: 0,
  });

  // Local draft title mirrors the server value but updates on every keystroke
  // without round-tripping. We push it to the backend on a short debounce so
  // the next re-open (or refresh) sees exactly what the user typed.
  const [titleDraft, setTitleDraft] = useState('');
  useEffect(() => {
    if (config) setTitleDraft(config.title);
  }, [config]);

  const updateConfig = useMutation({
    mutationFn: (patch: Parameters<typeof printApi.updateBookConfig>[1]) =>
      printApi.updateBookConfig(journalId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print', 'book-config', journalId] });
    },
  });

  // Debounce title saves. We keep the latest in-flight timer in a ref so
  // every new keystroke resets it; the server only sees the last value the
  // user settled on.
  const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!config) return;
    // Falls back to '' when the user cleared the input — the backend treats
    // null/empty as "reset to the journal title".
    const normalized = titleDraft.trim();
    const currentServer = config.title;
    if (normalized === currentServer || (normalized === '' && currentServer === config.journalTitle)) {
      return;
    }
    if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    titleSaveTimer.current = setTimeout(() => {
      updateConfig.mutate({ title: normalized === '' ? null : normalized });
    }, 500);
    return () => {
      if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current);
    };
    // We intentionally omit `updateConfig` from deps — it's a stable
    // mutate function, and including it would re-arm the timer on every
    // mutation state change (loading/success/idle).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleDraft, config]);

  const excludedSet = new Set(config?.excludedEntryIds ?? []);
  const includedCount = (config?.entries.length ?? 0) - excludedSet.size;

  const toggleEntry = (entryId: string) => {
    if (!config) return;
    const next = new Set(excludedSet);
    if (next.has(entryId)) next.delete(entryId);
    else next.add(entryId);
    updateConfig.mutate({ excludedEntryIds: Array.from(next) });
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPageCount, setPreviewPageCount] = useState<number | null>(null);
  const preview = useMutation({
    mutationFn: () => printApi.previewBook(journalId),
    onSuccess: (data) => {
      setPreviewUrl(data.pdfUrl);
      setPreviewPageCount(data.pageCount);
      // Open the generated PDF in a new tab. Users who have popup blockers
      // on will still see the "Open preview" link below as a fallback.
      window.open(data.pdfUrl, '_blank', 'noopener,noreferrer');
    },
  });

  // Reset preview state whenever the modal closes so reopening doesn't flash
  // last session's URL as if it were current.
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      setPreviewPageCount(null);
    }
  }, [isOpen]);

  const previewOutdated = previewUrl !== null && (updateConfig.isPending || updateConfig.isSuccess);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit your printed book"
      description="Give your book a title and choose which entries to include. Changes save as you edit."
      size="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading your book…
        </div>
      ) : isError || !config ? (
        <div className="text-red-600 text-sm py-6">
          Couldn't load the book editor. Please close and try again.
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="book-title">
              Book title
            </label>
            <Input
              id="book-title"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder={config.journalTitle}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shown on the cover and spine. Leave blank to use the journal title ({config.journalTitle}).
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Entries ({includedCount} of {config.entries.length} included)
              </label>
            </div>
            {config.entries.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border rounded-md">
                No entries yet — your book will be mostly empty.
              </p>
            ) : (
              <ul className="max-h-80 overflow-y-auto border rounded-md divide-y">
                {config.entries.map((entry) => {
                  const excluded = excludedSet.has(entry.id);
                  const preview = entry.content.length > 90
                    ? entry.content.slice(0, 90) + '…'
                    : entry.content;
                  return (
                    <li key={entry.id} className="flex items-start gap-3 p-3 hover:bg-accent/30">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={!excluded}
                        onChange={() => toggleEntry(entry.id)}
                        aria-label={excluded ? 'Include this entry' : 'Exclude this entry'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{entry.participantName}</span>
                          <span>·</span>
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                          {entry.hasPhoto && (
                            <span className="inline-flex items-center gap-0.5" title="Includes a photo">
                              <ImageIcon className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-0.5 ${excluded ? 'line-through text-muted-foreground' : ''}`}>
                          {preview}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {previewUrl && !previewOutdated && previewPageCount != null && (
                <span>
                  Last preview: {previewPageCount} pages ·{' '}
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-0.5"
                  >
                    open again <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              )}
              {previewOutdated && <span>Your edits aren't in the last preview — regenerate to see them.</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                Done
              </Button>
              <Button
                variant="outline"
                onClick={() => preview.mutate()}
                disabled={preview.isPending || includedCount === 0}
              >
                {preview.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rendering…
                  </>
                ) : (
                  'Preview book'
                )}
              </Button>
              {onRequestOrder && (
                <Button
                  onClick={onRequestOrder}
                  disabled={includedCount === 0}
                  title="Order a professionally printed copy"
                >
                  Order a printed copy
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
