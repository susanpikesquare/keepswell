import { useParams, Link } from 'react-router-dom';
import { BookOpen, AlertCircle, Heart } from 'lucide-react';
import { useSharedJournal } from '../../hooks';
import { MemoryTimeline } from '../../components/journal/MemoryTimeline';
import { PageLoader, Button } from '../../components/ui';
import type { TemplateType, Entry } from '../../types';

export function SharedBookPage() {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, error } = useSharedJournal(token || '');

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Memory Book Not Found
          </h1>
          <p className="text-slate-600 mb-6">
            This memory book doesn't exist or is no longer being shared.
            The owner may have disabled sharing.
          </p>
          <Link to="/">
            <Button>
              <Heart className="h-4 w-4 mr-2" />
              Create Your Own Memory Book
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { journal, entries } = data;

  return (
    <div className="min-h-screen">
      {/* Shared header banner */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            <span>Shared Memory Book</span>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">
            Create your own →
          </Link>
        </div>
      </div>

      {/* Memory Timeline */}
      <MemoryTimeline
        entries={entries as Entry[]}
        templateType={(journal.template_type as TemplateType) || 'custom'}
        journalTitle={journal.title || 'Memory Book'}
      />

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-t py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Create Your Own Memory Book
          </h2>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Collect stories, photos, and cherished moments from the people you love.
            Send prompts via text and watch the memories flow in.
          </p>
          <Link to="/">
            <Button size="lg">
              <Heart className="h-5 w-5 mr-2" />
              Get Started Free
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
