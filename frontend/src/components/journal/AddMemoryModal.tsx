import { useState } from 'react';
import { PlusCircle, Image, X, Loader2 } from 'lucide-react';
import { Modal, Button, Input } from '../ui';
import { useCreateEntry, useParticipants } from '../../hooks';
import type { Participant } from '../../types';

interface AddMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalId: string;
}

export function AddMemoryModal({ isOpen, onClose, journalId }: AddMemoryModalProps) {
  const createEntry = useCreateEntry(journalId);
  const { data: participants } = useParticipants(journalId);

  const [content, setContent] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [contributorName, setContributorName] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');
  const [error, setError] = useState('');

  const handleAddImage = () => {
    if (imageInput.trim() && imageInput.startsWith('http')) {
      setImageUrls([...imageUrls, imageInput.trim()]);
      setImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim() && imageUrls.length === 0) {
      setError('Please add some text or an image');
      return;
    }

    try {
      await createEntry.mutateAsync({
        content: content.trim() || undefined,
        participant_id: selectedParticipant || undefined,
        contributor_name: !selectedParticipant ? contributorName || undefined : undefined,
        media_urls: imageUrls.length > 0 ? imageUrls : undefined,
      });

      // Reset form and close
      setContent('');
      setSelectedParticipant('');
      setContributorName('');
      setImageUrls([]);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add memory');
    }
  };

  const handleClose = () => {
    setContent('');
    setSelectedParticipant('');
    setContributorName('');
    setImageUrls([]);
    setError('');
    onClose();
  };

  const participantList = participants || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Memory"
      description="Add a memory directly to your journal (free - no SMS required)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Free Feature Badge */}
        <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
          <PlusCircle className="h-3 w-3" />
          Free - Unlimited web uploads
        </div>

        {/* Contributor Selection */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Who is this memory from?
          </label>
          <select
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Me (journal owner)</option>
            {participantList.map((p: Participant) => (
              <option key={p.id} value={p.id}>
                {p.display_name} {p.relationship ? `(${p.relationship})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Custom contributor name (only if "Me" is selected) */}
        {!selectedParticipant && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Display name (optional)
            </label>
            <Input
              type="text"
              value={contributorName}
              onChange={(e) => setContributorName(e.target.value)}
              placeholder="How should your name appear?"
            />
          </div>
        )}

        {/* Memory Content */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Memory / Story
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share a memory, story, or message..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[120px] resize-none"
          />
        </div>

        {/* Image URLs */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            <Image className="h-4 w-4 inline mr-1" />
            Add Photos (optional)
          </label>
          <div className="flex gap-2">
            <Input
              type="url"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="Paste image URL..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddImage}
              disabled={!imageInput.trim()}
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paste URLs from image hosting services like Imgur, Cloudinary, or direct image links
          </p>

          {/* Image previews */}
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-md border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="%23ccc"><rect width="64" height="64"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">Error</text></svg>';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={createEntry.isPending}
            className="flex-1"
          >
            {createEntry.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Memory
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
