import { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useJournal, useJournalEntries } from '../../hooks';
import { getTheme } from '../../lib/themes';
import type { Entry } from '../../api';

const FRONTEND_URL = process.env.EXPO_PUBLIC_FRONTEND_URL || 'https://keepswell.com';

export default function JournalBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: journal, isLoading: journalLoading } = useJournal(id || '');
  const { data: entriesData, isLoading: entriesLoading } = useJournalEntries(id || '');

  const theme = useMemo(
    () => getTheme(journal?.template_type || 'custom'),
    [journal?.template_type]
  );

  const entries = entriesData?.data || [];
  const visibleEntries = useMemo(() => entries.filter((e) => !e.is_hidden), [entries]);
  const grouped = useMemo(() => groupEntriesByDay(visibleEntries), [visibleEntries]);

  const handleShare = async () => {
    if (!journal) return;
    try {
      const url = `${FRONTEND_URL}/journals/${id}/book`;
      await Share.share({
        title: journal.title,
        message: `Check out "${journal.title}" on Keepswell — a memory journal by PikeSquare, LLC.\n\n${url}`,
        url,
      });
    } catch {
      // user dismissed or sharing failed silently
    }
  };

  if (journalLoading || entriesLoading || !journal) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bgColor }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.timelineDot} />
      </View>
    );
  }

  const hasCover = !!journal.cover_image_url;
  const fontFamilyQuote = theme.quoteFontFamily === 'serif'
    ? Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' })
    : undefined;

  return (
    <View style={[styles.container, { backgroundColor: theme.bgColor }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Floating top bar over the hero */}
      <SafeAreaView style={styles.topBar} edges={['top']} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: hasCover ? 'rgba(0,0,0,0.4)' : theme.cardBg }]}
          onPress={() => router.back()}
        >
          <FontAwesome name="chevron-left" size={16} color={hasCover ? '#fff' : theme.primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: hasCover ? 'rgba(0,0,0,0.4)' : theme.cardBg }]}
          onPress={handleShare}
        >
          <FontAwesome name="share-square-o" size={16} color={hasCover ? '#fff' : theme.primaryColor} />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        {hasCover ? (
          <View style={styles.heroWithCover}>
            <Image
              source={{ uri: journal.cover_image_url! }}
              style={styles.coverImage}
              resizeMode="cover"
            />
            <View style={styles.coverGradient} />
            <View style={[styles.heroTextContainer, { paddingTop: insets.top + 72 }]}>
              <FontAwesome name={theme.iconName} size={22} color="rgba(255,255,255,0.85)" />
              <Text style={[styles.heroTitle, { color: '#fff', fontFamily: fontFamilyQuote }]}>
                {journal.title}
              </Text>
              <Text style={[styles.heroSubtitle, { color: 'rgba(255,255,255,0.85)' }]}>
                {visibleEntries.length} {visibleEntries.length === 1 ? 'memory' : 'memories'} collected
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.heroPlain, { paddingTop: insets.top + 72 }]}>
            <FontAwesome name={theme.iconName} size={28} color={theme.accentColor} />
            <Text
              style={[
                styles.heroTitle,
                { color: theme.primaryColor, fontFamily: fontFamilyQuote },
              ]}
            >
              {journal.title}
            </Text>
            <Text style={[styles.heroSubtitle, { color: theme.mutedColor }]}>
              {visibleEntries.length} {visibleEntries.length === 1 ? 'memory' : 'memories'} collected
            </Text>
          </View>
        )}

        {/* Timeline */}
        {visibleEntries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <FontAwesome name={theme.iconName} size={36} color={theme.accentColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.primaryColor, fontFamily: fontFamilyQuote }]}>
              No memories yet
            </Text>
            <Text style={[styles.emptyText, { color: theme.mutedColor }]}>
              Invite contributors and send prompts to start collecting memories.
            </Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {/* Timeline vertical line */}
            <View style={[styles.timelineLine, { backgroundColor: theme.timelineColor }]} />

            {Object.entries(grouped).map(([dateKey, dateEntries]) => (
              <View key={dateKey} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <View style={[styles.dateDot, { backgroundColor: theme.timelineDot }]}>
                    <FontAwesome name="calendar" size={14} color="#fff" />
                  </View>
                  <View>
                    <Text style={[styles.dateHeading, { color: theme.primaryColor }]}>
                      {formatDateHeading(dateKey)}
                    </Text>
                    <Text style={[styles.dateCount, { color: theme.mutedColor }]}>
                      {dateEntries.length} {dateEntries.length === 1 ? 'memory' : 'memories'}
                    </Text>
                  </View>
                </View>

                {dateEntries.map((entry) => (
                  <MemoryCard
                    key={entry.id}
                    entry={entry}
                    theme={theme}
                    fontFamilyQuote={fontFamilyQuote}
                  />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface MemoryCardProps {
  entry: Entry;
  theme: ReturnType<typeof getTheme>;
  fontFamilyQuote?: string;
}

function MemoryCard({ entry, theme, fontFamilyQuote }: MemoryCardProps) {
  const photos = entry.media_attachments || [];
  const hasPhoto = photos.length > 0;
  const contributorName = entry.participant?.display_name || 'Anonymous';
  const relationship = entry.participant?.relationship;
  const initial = contributorName[0]?.toUpperCase() || '?';

  return (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      {hasPhoto && (
        <View style={styles.photoContainer}>
          <Image
            source={{ uri: photos[0].stored_url }}
            style={styles.cardPhoto}
            resizeMode="cover"
          />
          {photos.length > 1 && (
            <View style={styles.morePhotos}>
              <Text style={styles.morePhotosText}>+{photos.length - 1}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.timelineDot }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contributorName, { color: theme.textColor }]} numberOfLines={1}>
              {contributorName}
            </Text>
            {relationship && (
              <Text style={[styles.relationship, { color: theme.mutedColor }]} numberOfLines={1}>
                {relationship}
              </Text>
            )}
          </View>
        </View>

        {!!entry.content && (
          <View style={styles.quoteContainer}>
            <FontAwesome
              name="quote-left"
              size={14}
              color={theme.accentColor}
              style={styles.quoteIcon}
            />
            <Text
              style={[
                styles.quoteText,
                {
                  color: theme.textColor,
                  fontStyle: theme.quoteFontStyle,
                  fontFamily: fontFamilyQuote,
                },
              ]}
            >
              {entry.content}
            </Text>
          </View>
        )}

        <Text style={[styles.timestamp, { color: theme.mutedColor }]}>
          {formatTime(entry.created_at)}
        </Text>
      </View>
    </View>
  );
}

// ---- helpers ----

function groupEntriesByDay(entries: Entry[]): Record<string, Entry[]> {
  const groups: Record<string, Entry[]> = {};
  for (const entry of entries) {
    const key = new Date(entry.created_at).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(entry);
  }
  // Sort keys descending (newest first)
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const sorted: Record<string, Entry[]> = {};
  for (const k of sortedKeys) sorted[k] = groups[k];
  return sorted;
}

function formatDateHeading(dateKey: string): string {
  const date = new Date(`${dateKey}T12:00:00`);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ---- styles ----

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  heroWithCover: {
    position: 'relative',
    height: 320,
    marginBottom: 24,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTextContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    alignItems: 'center',
  },
  heroPlain: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  timeline: {
    paddingHorizontal: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 36,
    top: 24,
    bottom: 0,
    width: 3,
    borderRadius: 2,
  },
  dateGroup: {
    marginBottom: 28,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  dateDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dateHeading: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateCount: {
    fontSize: 12,
    marginTop: 2,
  },
  card: {
    marginLeft: 56,
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  photoContainer: {
    position: 'relative',
    aspectRatio: 4 / 3,
  },
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  morePhotos: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  morePhotosText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  contributorName: {
    fontSize: 15,
    fontWeight: '600',
  },
  relationship: {
    fontSize: 12,
    marginTop: 2,
  },
  quoteContainer: {
    position: 'relative',
    paddingLeft: 8,
    marginTop: 4,
  },
  quoteIcon: {
    position: 'absolute',
    left: -4,
    top: 0,
    opacity: 0.3,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: 14,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 10,
    textAlign: 'right',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
