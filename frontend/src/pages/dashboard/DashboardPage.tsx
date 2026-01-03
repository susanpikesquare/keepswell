import { Link } from 'react-router-dom';
import { Plus, BookHeart, Users, Crown, ArrowRight, Globe } from 'lucide-react';
import { useJournals, useAuthSync, useUsageLimits, useIsPro } from '../../hooks';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, PageLoader } from '../../components/ui';
import { formatRelativeTime } from '../../lib/utils';
import type { Journal } from '../../types';

export function DashboardPage() {
  const { isLoaded, isSignedIn } = useAuthSync();
  const { data: journals, isLoading, error } = useJournals();
  const { data: usageLimits } = useUsageLimits();
  const { isPro } = useIsPro();

  // Wait for auth to be ready
  if (!isLoaded) {
    return <PageLoader />;
  }

  // Show loading while fetching journals
  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Failed to load journals.</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isSignedIn ? 'Please try refreshing the page.' : 'Please sign in to view your journals.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Usage Stats / Upgrade Banner for Free Users */}
      {usageLimits && !isPro && (
        <div className="mb-6 bg-gradient-to-r from-primary/5 to-amber-50 rounded-xl p-4 border border-primary/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Free Plan</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    Journals: <strong className="text-foreground">{usageLimits.journalCount}</strong> / {usageLimits.maxJournals === -1 ? 'Unlimited' : usageLimits.maxJournals}
                  </span>
                  <span>
                    SMS: <strong className="text-foreground">Web dashboard only</strong>
                  </span>
                </div>
              </div>
            </div>
            <Link to="/pricing">
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                <Crown className="h-4 w-4 mr-2 text-amber-500" />
                Upgrade to Pro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Pro Badge */}
      {isPro && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-amber-500" />
            <div>
              <span className="font-medium text-amber-800">Pro Member</span>
              <span className="text-sm text-amber-600 ml-2">Unlimited journals & SMS enabled</span>
            </div>
            <Link to="/pricing" className="ml-auto text-sm text-amber-700 hover:underline">
              Manage subscription
            </Link>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Journals</h1>
          <p className="text-muted-foreground">Create and manage your memory journals</p>
        </div>
        <Link to="/journals/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Journal
          </Button>
        </Link>
      </div>

      {journals && journals.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.map((journal) => (
            <JournalCard key={journal.id} journal={journal} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function JournalCard({ journal }: { journal: Journal }) {
  return (
    <Link to={`/journals/${journal.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <BookHeart className="h-8 w-8 text-primary" />
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                journal.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {journal.status}
            </span>
          </div>
          <CardTitle className="mt-4">{journal.title}</CardTitle>
          <CardDescription>{journal.description || 'No description'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{journal.participants?.length || 0} participants</span>
            </div>
            <span>Created {formatRelativeTime(journal.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <BookHeart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-xl font-semibold mb-2">No journals yet</h2>
      <p className="text-muted-foreground mb-6">
        Create your first memory journal to start collecting stories from your loved ones.
      </p>
      <Link to="/journals/new">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Your First Journal
        </Button>
      </Link>
    </div>
  );
}
