import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Share2 } from 'lucide-react';
import { useJournal, useEntries, useAuthSync } from '../../hooks';
import { Button, PageLoader } from '../../components/ui';
import { MemoryTimeline, ShareModal } from '../../components/journal';
import { getTheme } from '../../lib/themes';

export function MemoryBookPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded } = useAuthSync();
  const { data: journal, isLoading: journalLoading, error: journalError } = useJournal(id || '');
  const { data: entriesData, isLoading: entriesLoading } = useEntries(id || '');
  const [showShareModal, setShowShareModal] = useState(false);

  if (!isLoaded || journalLoading) {
    return <PageLoader />;
  }

  if (journalError || !journal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Journal not found.</p>
          <Link to="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const theme = getTheme(journal.template_type);
  const entries = entriesData?.data || [];

  return (
    <div className="min-h-screen">
      {/* Floating nav bar */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between">
        <Link
          to={`/journals/${id}`}
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${theme.cardBg} ${theme.cardShadow} border ${theme.cardBorder} ${theme.textColor} hover:scale-105 transition-transform`}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowShareModal(true)}
            className="bg-primary text-primary-foreground shadow-lg"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          <Link to={`/journals/${id}`}>
            <Button
              size="sm"
              variant="outline"
              className={`${theme.cardBg} ${theme.cardShadow} border ${theme.cardBorder}`}
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage
            </Button>
          </Link>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        journalId={id || ''}
        journalTitle={journal.title}
      />

      {/* Memory Timeline */}
      {entriesLoading ? (
        <div className={`min-h-screen ${theme.bgGradient} flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
            <p className={theme.mutedColor}>Loading memories...</p>
          </div>
        </div>
      ) : (
        <MemoryTimeline
          entries={entries}
          templateType={journal.template_type}
          journalTitle={journal.title}
        />
      )}
    </div>
  );
}
