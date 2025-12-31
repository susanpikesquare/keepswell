import { useState } from 'react';
import { Heart, Sparkles, BookHeart, Trash2, EyeOff, MoreVertical, Calendar, Quote, Plane } from 'lucide-react';
import { Avatar, Button } from '../ui';
import { getThemeFromConfig, type JournalTheme } from '../../lib/themes';
import { useDeleteEntry, useUpdateEntry, useJournalConfig } from '../../hooks';
import type { Entry, TemplateType, FramingRulesConfig } from '../../types';

interface MemoryTimelineProps {
  entries: Entry[];
  templateType: TemplateType;
  journalTitle: string;
  journalId?: string; // Optional: if provided, fetches config from API
  coverImageUrl?: string; // Optional cover image for the header
}

export function MemoryTimeline({ entries, templateType, journalTitle, journalId, coverImageUrl }: MemoryTimelineProps) {
  // Fetch config from API if journalId is provided
  const { data: config } = useJournalConfig(journalId || '');

  // Get theme from API config or fall back to static theme
  const theme = getThemeFromConfig(config?.visualRules, templateType);
  const framingRules = config?.framingRules;

  if (entries.length === 0) {
    return <EmptyTimeline theme={theme} templateType={templateType} />;
  }

  // Group entries by the configured grouping (day, week, month, chapter)
  const groupBy = config?.visualRules?.timeline?.groupBy || 'day';
  const groupedEntries = groupEntriesByDate(entries, groupBy);

  return (
    <div className={`min-h-screen ${theme.bgGradient} ${theme.bgPattern}`}>
      {/* Header with optional cover image */}
      {coverImageUrl ? (
        <div className="relative">
          {/* Cover image */}
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={coverImageUrl}
              alt="Journal cover"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
          </div>
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-center text-white">
            <div className="inline-flex items-center gap-2 mb-2">
              <TemplateIcon templateType={templateType} className="h-6 w-6 text-white/80" />
            </div>
            <h1 className="text-4xl font-serif font-bold drop-shadow-lg mb-2">
              {journalTitle}
            </h1>
            <p className="text-white/80 drop-shadow">
              {entries.length} {entries.length === 1 ? 'memory' : 'memories'} collected
            </p>
          </div>
        </div>
      ) : (
        <div className="pt-12 pb-8 px-6 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <TemplateIcon templateType={templateType} className={`h-6 w-6 ${theme.accentColor}`} />
          </div>
          <h1 className={`text-4xl font-serif font-bold ${theme.primaryColor} mb-2`}>
            {journalTitle}
          </h1>
          <p className={`${theme.mutedColor}`}>
            {entries.length} {entries.length === 1 ? 'memory' : 'memories'} collected
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="relative">
          {/* Timeline line */}
          <div
            className={`absolute left-8 top-0 bottom-0 w-1 ${theme.timelineColor} rounded-full`}
            style={{ transform: 'translateX(-50%)' }}
          />

          {/* Entries grouped by date */}
          {Object.entries(groupedEntries).map(([dateKey, dateEntries]) => (
            <div key={dateKey} className="mb-12">
              {/* Date header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full ${theme.timelineDot} flex items-center justify-center z-10`}>
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={`text-lg font-semibold ${theme.primaryColor}`}>
                    {formatDateHeading(dateKey)}
                  </p>
                  <p className={`text-sm ${theme.mutedColor}`}>
                    {dateEntries.length} {dateEntries.length === 1 ? 'memory' : 'memories'}
                  </p>
                </div>
              </div>

              {/* Entries for this date */}
              <div className="ml-8 pl-8 space-y-6">
                {dateEntries.map((entry) => (
                  <MemoryCard key={entry.id} entry={entry} theme={theme} framingRules={framingRules} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MemoryCardProps {
  entry: Entry;
  theme: JournalTheme;
  framingRules?: FramingRulesConfig;
}

function MemoryCard({ entry, theme, framingRules }: MemoryCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const deleteEntry = useDeleteEntry();
  const updateEntry = useUpdateEntry();

  const hasMedia = entry.media_attachments && entry.media_attachments.length > 0;
  const primaryMedia = hasMedia ? entry.media_attachments![0] : null;

  const handleDelete = async () => {
    try {
      await deleteEntry.mutateAsync(entry.id);
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleHide = async () => {
    try {
      await updateEntry.mutateAsync({ id: entry.id, data: { is_hidden: true } });
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to hide:', error);
    }
  };

  return (
    <div
      className={`relative ${theme.cardBg} ${theme.cardBorder} ${theme.cardShadow} rounded-2xl overflow-hidden border group transition-all duration-300 hover:scale-[1.02]`}
    >
      {/* Photo section */}
      {primaryMedia && (
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={primaryMedia.stored_url}
            alt="Memory"
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
          {/* Photo overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

          {/* Additional photos indicator */}
          {entry.media_attachments && entry.media_attachments.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              +{entry.media_attachments.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Content section */}
      <div className="p-5">
        {/* Author and time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar
              src={entry.participant?.avatar_url}
              name={entry.participant?.display_name || 'Unknown'}
              size="sm"
            />
            <div>
              <p className={`font-medium ${theme.textColor}`}>
                {formatAttribution(entry, framingRules)}
              </p>
              {framingRules?.attribution?.format !== 'anonymous' && entry.participant?.relationship && (
                <p className={`text-xs ${theme.mutedColor}`}>
                  {entry.participant.relationship}
                </p>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreVertical className={`h-4 w-4 ${theme.mutedColor}`} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border rounded-xl shadow-xl z-10 overflow-hidden">
                <button
                  onClick={handleHide}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Hide
                </button>
                <button
                  onClick={() => { setConfirmDelete(true); setShowMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quote/Content */}
        <div className="relative">
          <Quote className={`absolute -top-1 -left-1 h-6 w-6 ${theme.accentColor} opacity-20`} />
          <p className={`text-lg leading-relaxed ${theme.textColor} pl-4 font-serif italic`}>
            {entry.content}
          </p>
        </div>

        {/* Time stamp */}
        {framingRules?.attribution?.showTimestamp !== false && (
          <p className={`text-xs ${theme.mutedColor} mt-4 text-right`}>
            {formatTimestamp(entry.created_at, framingRules?.attribution?.timestampFormat)}
          </p>
        )}
      </div>

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-xl p-5 max-w-xs text-center">
            <Trash2 className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="font-medium text-gray-900 mb-1">Delete this memory?</p>
            <p className="text-sm text-gray-500 mb-4">This cannot be undone.</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleteEntry.isPending}
              >
                {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyTimeline({ theme, templateType }: { theme: JournalTheme; templateType: TemplateType }) {
  return (
    <div className={`min-h-[400px] ${theme.bgGradient} ${theme.bgPattern} flex items-center justify-center`}>
      <div className="text-center p-8">
        <div className={`w-20 h-20 rounded-full ${theme.cardBg} ${theme.cardShadow} flex items-center justify-center mx-auto mb-4`}>
          <TemplateIcon templateType={templateType} className={`h-10 w-10 ${theme.accentColor}`} />
        </div>
        <h3 className={`text-xl font-serif font-semibold ${theme.primaryColor} mb-2`}>
          No memories yet
        </h3>
        <p className={`${theme.mutedColor} max-w-xs`}>
          Start collecting memories by inviting participants and sending prompts
        </p>
      </div>
    </div>
  );
}

// Template icon component
function TemplateIcon({ templateType, className }: { templateType: TemplateType; className?: string }) {
  switch (templateType) {
    case 'family':
      return <Heart className={className} />;
    case 'friends':
      return <Sparkles className={className} />;
    case 'romantic':
      return <Heart className={`${className} fill-current`} />;
    case 'vacation':
      return <Plane className={className} />;
    case 'custom':
    default:
      return <BookHeart className={className} />;
  }
}

// Helper functions
function groupEntriesByDate(entries: Entry[], groupBy: 'day' | 'week' | 'month' | 'chapter' = 'day'): Record<string, Entry[]> {
  const groups: Record<string, Entry[]> = {};

  entries.forEach((entry) => {
    const date = new Date(entry.created_at);
    let key: string;

    switch (groupBy) {
      case 'week': {
        // Get start of week (Sunday)
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().split('T')[0];
        break;
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'chapter':
        // For chapter, we'll just use month for now
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'day':
      default:
        key = date.toISOString().split('T')[0];
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(entry);
  });

  return groups;
}

function formatDateHeading(dateKey: string): string {
  // Handle month format (YYYY-MM)
  if (dateKey.length === 7) {
    const [year, month] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  const date = new Date(dateKey + 'T12:00:00');
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function formatAttribution(entry: Entry, framingRules?: FramingRulesConfig): string {
  const format = framingRules?.attribution?.format || 'name';
  const participant = entry.participant;

  if (!participant) return 'Unknown';

  switch (format) {
    case 'anonymous':
      return 'Anonymous';
    case 'relationship':
      return participant.relationship || participant.display_name || 'Unknown';
    case 'both':
      if (participant.relationship) {
        return `${participant.display_name} (${participant.relationship})`;
      }
      return participant.display_name || 'Unknown';
    case 'name':
    default:
      return participant.display_name || 'Unknown';
  }
}

function formatTimestamp(dateString: string, format?: 'relative' | 'absolute' | 'friendly'): string {
  const date = new Date(dateString);
  const now = new Date();

  switch (format) {
    case 'relative': {
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    case 'absolute':
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit',
      });
    case 'friendly':
    default:
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
  }
}
