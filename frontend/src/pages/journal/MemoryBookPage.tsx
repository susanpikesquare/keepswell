import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Settings, Share2, Download, Loader2, BookOpen } from 'lucide-react';
import { useJournal, useEntries, useAuthSync, useExportPdf, useIsPremium } from '../../hooks';
import { Button, PageLoader } from '../../components/ui';
import { MemoryTimeline, ShareModal, BookEditorModal, OrderBookModal } from '../../components/journal';
import { UpgradeModal } from '../../components/subscription';
import { getTheme } from '../../lib/themes';

export function MemoryBookPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded } = useAuthSync();
  const { data: journal, isLoading: journalLoading, error: journalError } = useJournal(id || '');
  const { data: entriesData, isLoading: entriesLoading } = useEntries(id || '');
  const { mutate: exportPdf, isPending: isExporting } = useExportPdf();
  const { isPremium } = useIsPremium();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBookEditor, setShowBookEditor] = useState(false);
  const [showOrderBook, setShowOrderBook] = useState(false);
  const [orderBanner, setOrderBanner] = useState<null | 'success' | 'canceled'>(null);

  // Stripe redirects back here with ?book_order=success|canceled after a
  // book-order checkout. Convert that into an in-page banner once, then
  // scrub the query string so a refresh doesn't re-show it.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const outcome = searchParams.get('book_order');
    if (outcome === 'success' || outcome === 'canceled') {
      setOrderBanner(outcome);
      const next = new URLSearchParams(searchParams);
      next.delete('book_order');
      next.delete('orderId');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleExport = () => {
    if (id) {
      exportPdf({ journalId: id });
    }
  };

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
            onClick={handleExport}
            disabled={isExporting}
            className="bg-primary text-primary-foreground shadow-lg"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            {isExporting ? 'Exporting...' : 'Export PDF'}
            {!isPremium && <span className="ml-1 text-xs opacity-75">(watermarked)</span>}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowBookEditor(true)}
            variant="outline"
            className={`${theme.cardBg} ${theme.cardShadow} border ${theme.cardBorder}`}
            title="Design and preview your printed book"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Print book
          </Button>
          <Button
            size="sm"
            onClick={() => setShowShareModal(true)}
            variant="outline"
            className={`${theme.cardBg} ${theme.cardShadow} border ${theme.cardBorder}`}
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

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        journalId={id || ''}
        journalTitle={journal.title}
      />
      <BookEditorModal
        isOpen={showBookEditor}
        onClose={() => setShowBookEditor(false)}
        journalId={id || ''}
        onRequestOrder={() => {
          setShowBookEditor(false);
          setShowOrderBook(true);
        }}
      />
      <OrderBookModal
        isOpen={showOrderBook}
        onClose={() => setShowOrderBook(false)}
        journalId={id || ''}
      />
      {orderBanner && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md px-5 py-3 rounded-full shadow-lg text-sm font-medium ${
            orderBanner === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-gray-800 text-white'
          }`}
          role="status"
        >
          {orderBanner === 'success'
            ? "Thanks! Your printed book is on its way — we'll send tracking info by email."
            : 'Checkout canceled — your card was not charged.'}
          <button
            type="button"
            onClick={() => setOrderBanner(null)}
            className="ml-3 opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="watermark-free PDF export"
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
          journalId={id}
          coverImageUrl={journal.cover_image_url || undefined}
        />
      )}
    </div>
  );
}
