import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Settings, UserPlus, MessageSquare, Calendar, Trash2, EyeOff, MoreVertical, BookOpen } from 'lucide-react';
import { useJournal, useParticipants, useEntries, useAuthSync, useDeleteEntry, useUpdateEntry } from '../../hooks';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, PageLoader, Avatar } from '../../components/ui';
import { JournalSettingsModal, InviteParticipantModal } from '../../components/journal';
import { formatRelativeTime } from '../../lib/utils';
import type { Entry } from '../../types';

export function JournalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isLoaded } = useAuthSync();
  const { data: journal, isLoading: journalLoading, error: journalError } = useJournal(id || '');
  const { data: participants, isLoading: participantsLoading } = useParticipants(id || '');
  const { data: entriesData, isLoading: entriesLoading } = useEntries(id || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  if (!isLoaded || journalLoading || participantsLoading) {
    return <PageLoader />;
  }

  if (journalError || !journal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-destructive">
          <p>Failed to load journal.</p>
          <Link to="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const participantList = participants || [];
  const entries = entriesData?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back navigation */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Journal header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{journal.title}</h1>
          {journal.description && (
            <p className="text-muted-foreground">{journal.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{participantList.length} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Created {formatRelativeTime(journal.created_at)}</span>
            </div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                journal.status === 'active'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {journal.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/journals/${id}/book`}>
            <Button>
              <BookOpen className="h-4 w-4 mr-2" />
              View Memory Book
            </Button>
          </Link>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <JournalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        journal={journal}
      />

      {/* Invite Participant Modal */}
      <InviteParticipantModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        journalId={id || ''}
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content area - Entry Timeline */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Entries
              </CardTitle>
              <CardDescription>
                {entries.length > 0
                  ? `${entriesData?.total || entries.length} memories collected`
                  : 'Entries will appear here once participants start responding'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading entries...
                </div>
              ) : entries.length > 0 ? (
                <div className="space-y-6">
                  {entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyEntriesState />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Participants */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
              <Button size="sm" onClick={() => setShowInvite(true)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {participantList.length > 0 ? (
                <ul className="space-y-3">
                  {participantList.map((participant) => (
                    <li key={participant.id} className="flex items-center gap-3">
                      <Avatar
                        src={participant.avatar_url}
                        name={participant.display_name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{participant.display_name}</p>
                        {participant.relationship && (
                          <p className="text-xs text-muted-foreground">{participant.relationship}</p>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          participant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : participant.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {participant.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No participants yet</p>
                  <p className="text-xs mt-1">
                    Add participants to start collecting memories
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prompt Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prompt Schedule</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Prompts are sent <strong>{journal.prompt_frequency}</strong>
                {journal.prompt_day_of_week !== null && (
                  <> on {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][journal.prompt_day_of_week]}</>
                )}
                {journal.prompt_time && <> at {journal.prompt_time}</>}
              </p>
              <p className="mt-2 text-xs">Timezone: {journal.timezone}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EntryCard({ entry }: { entry: Entry }) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteEntry = useDeleteEntry();
  const updateEntry = useUpdateEntry();
  const hasMedia = entry.media_attachments && entry.media_attachments.length > 0;

  const handleDelete = async () => {
    try {
      await deleteEntry.mutateAsync(entry.id);
      setConfirmDelete(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to delete entry:', error);
    }
  };

  const handleHide = async () => {
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        data: { is_hidden: true },
      });
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to hide entry:', error);
    }
  };

  return (
    <div className="border-l-2 border-primary/30 pl-4 pb-2 group">
      <div className="flex items-start gap-3">
        <Avatar
          src={entry.participant?.avatar_url}
          name={entry.participant?.display_name || 'Unknown'}
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{entry.participant?.display_name || 'Unknown'}</span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(entry.created_at)}
              </span>
            </div>
            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-background border rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleHide}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                  >
                    <EyeOff className="h-4 w-4" />
                    Hide entry
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete entry
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{entry.content}</p>
          {hasMedia && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {entry.media_attachments!.map((media) => (
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
                    className="h-24 w-24 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive">Delete this entry?</p>
              <p className="text-xs text-muted-foreground mt-1">This action cannot be undone.</p>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteEntry.isPending}
                >
                  {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyEntriesState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p className="font-medium">No entries yet</p>
      <p className="text-sm mt-2">
        Entries will appear here when participants respond to prompts
      </p>
    </div>
  );
}
