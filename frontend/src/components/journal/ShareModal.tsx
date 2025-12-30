import { useState } from 'react';
import { Link2, Mail, MessageSquare, Copy, Check, Globe, Lock, ExternalLink } from 'lucide-react';
import { Modal, Button } from '../ui';
import { useSharingStatus, useEnableSharing, useDisableSharing } from '../../hooks';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalId: string;
  journalTitle: string;
}

export function ShareModal({ isOpen, onClose, journalId, journalTitle }: ShareModalProps) {
  const { data: sharingStatus, isLoading } = useSharingStatus(journalId);
  const enableSharing = useEnableSharing();
  const disableSharing = useDisableSharing();
  const [copied, setCopied] = useState(false);

  // Build the full share URL
  const baseUrl = window.location.origin;
  const shareUrl = sharingStatus?.shareUrl ? `${baseUrl}${sharingStatus.shareUrl}` : null;

  const handleEnableSharing = async () => {
    await enableSharing.mutateAsync(journalId);
  };

  const handleDisableSharing = async () => {
    await disableSharing.mutateAsync(journalId);
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEmailShare = () => {
    if (shareUrl) {
      const subject = encodeURIComponent(`Check out "${journalTitle}" - A Memory Book`);
      const body = encodeURIComponent(
        `I wanted to share this memory book with you:\n\n${journalTitle}\n\n${shareUrl}\n\nIt's a collection of cherished memories and stories.`
      );
      window.open(`mailto:?subject=${subject}&body=${body}`);
    }
  };

  const handleTextShare = () => {
    if (shareUrl) {
      const text = encodeURIComponent(
        `Check out this memory book: "${journalTitle}"\n${shareUrl}`
      );
      // Try native share API first (works on mobile)
      if (navigator.share) {
        navigator.share({
          title: journalTitle,
          text: `Check out this memory book: "${journalTitle}"`,
          url: shareUrl,
        }).catch(() => {
          // Fallback to SMS link
          window.open(`sms:?body=${text}`);
        });
      } else {
        // Desktop fallback - open SMS link (may not work on all desktops)
        window.open(`sms:?body=${text}`);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Memory Book"
      description="Share your memory book with friends and family"
      size="md"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sharingStatus?.isShared ? (
        <div className="space-y-6">
          {/* Sharing enabled state */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Globe className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Sharing is enabled</p>
              <p className="text-sm text-green-600">
                Anyone with the link can view this memory book
              </p>
            </div>
          </div>

          {/* Share URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Share link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl || ''}
                className="flex-1 px-3 py-2 text-sm bg-muted border rounded-md"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share options */}
          <div>
            <label className="block text-sm font-medium mb-3">Share via</label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex-col h-auto py-4"
              >
                <Link2 className="h-5 w-5 mb-1" />
                <span className="text-xs">Copy Link</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleEmailShare}
                className="flex-col h-auto py-4"
              >
                <Mail className="h-5 w-5 mb-1" />
                <span className="text-xs">Email</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleTextShare}
                className="flex-col h-auto py-4"
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                <span className="text-xs">Text</span>
              </Button>
            </div>
          </div>

          {/* Preview link */}
          <div className="flex items-center justify-between pt-4 border-t">
            <a
              href={shareUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Preview shared view
              <ExternalLink className="h-3 w-3" />
            </a>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisableSharing}
              disabled={disableSharing.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Lock className="h-4 w-4 mr-1" />
              {disableSharing.isPending ? 'Disabling...' : 'Disable sharing'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sharing disabled state */}
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">This memory book is private</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Enable sharing to create a link that anyone can use to view this memory book
            </p>
          </div>

          <Button
            onClick={handleEnableSharing}
            disabled={enableSharing.isPending}
            className="w-full"
          >
            <Globe className="h-4 w-4 mr-2" />
            {enableSharing.isPending ? 'Enabling...' : 'Enable Sharing'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            You can disable sharing at any time
          </p>
        </div>
      )}
    </Modal>
  );
}
