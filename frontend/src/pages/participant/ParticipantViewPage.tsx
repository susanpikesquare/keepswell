import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookHeart, MessageSquare } from 'lucide-react';
import { apiClient } from '../../api/client';
import { PageLoader, Avatar } from '../../components/ui';
import { formatRelativeTime } from '../../lib/utils';

interface ParticipantViewData {
  participant: {
    id: string;
    display_name: string;
    status: string;
  };
  journal: {
    id: string;
    title: string;
    description: string;
    cover_image_url: string | null;
    owner_name: string;
  };
  entries: Array<{
    id: string;
    content: string;
    entry_type: string;
    created_at: string;
    participant: {
      display_name: string;
      avatar_url: string | null;
    } | null;
    media_attachments: Array<{
      id: string;
      stored_url: string;
      thumbnail_url: string | null;
      media_type: string;
    }>;
  }>;
}

export function ParticipantViewPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery<ParticipantViewData>({
    queryKey: ['participant-view', token],
    queryFn: async () => {
      const response = await apiClient.get(`/p/${token}`);
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center max-w-md mx-auto px-4">
          <BookHeart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Link Expired or Invalid</h1>
          <p className="text-muted-foreground mb-6">
            This memory book link is no longer valid. Please contact the journal owner for a new invitation.
          </p>
          <Link to="/" className="text-primary hover:underline">
            Visit Keepswell
          </Link>
        </div>
      </div>
    );
  }

  const { journal, entries, participant } = data;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header with cover image */}
      <div className="relative">
        {journal.cover_image_url ? (
          <div
            className="h-64 bg-cover bg-center"
            style={{ backgroundImage: `url(${journal.cover_image_url})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-64 bg-gradient-to-br from-primary/20 to-pink-100" />
        )}

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">{journal.title}</h1>
            {journal.description && (
              <p className="text-white/90 drop-shadow">{journal.description}</p>
            )}
            <p className="text-sm text-white/70 mt-2">Created by {journal.owner_name}</p>
          </div>
        </div>
      </div>

      {/* Welcome message for participant */}
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="bg-primary/10 rounded-lg p-4 mb-6">
          <p className="text-sm">
            Welcome, <strong>{participant.display_name}</strong>! You're viewing the memory book.
            {participant.status === 'pending' && (
              <span className="block mt-1 text-muted-foreground">
                Reply YES to your text invitation to start contributing memories.
              </span>
            )}
            {participant.status === 'active' && (
              <span className="block mt-1 text-muted-foreground">
                Reply to prompts via text to add your own memories to this book.
              </span>
            )}
          </p>
        </div>

        {/* Entries */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Memories ({entries.length})
          </h2>

          {entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No memories yet</p>
              <p className="text-sm mt-1">Be the first to contribute!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-background rounded-lg border p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={entry.participant?.avatar_url || undefined}
                      name={entry.participant?.display_name || 'Unknown'}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {entry.participant?.display_name || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(entry.created_at)}
                        </span>
                      </div>
                      {entry.content && (
                        <p className="text-sm whitespace-pre-wrap">{entry.content}</p>
                      )}
                      {entry.media_attachments && entry.media_attachments.length > 0 && (
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {entry.media_attachments.map((media) => (
                            <a
                              key={media.id}
                              href={media.stored_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img
                                src={media.thumbnail_url || media.stored_url}
                                alt="Attached media"
                                className="h-32 w-32 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                              />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 border-t mt-12 bg-background">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>Powered by <a href="/" className="text-primary hover:underline">Keepswell</a></p>
        </div>
      </footer>
    </div>
  );
}
