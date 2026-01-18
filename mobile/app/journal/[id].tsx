import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import { useJournal, useJournalEntries } from '../../hooks';
import { ReactionBar } from '../../components/ReactionBar';
import { CommentSection } from '../../components/CommentSection';
import type { Entry } from '../../api';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 48 - 8) / 2; // Account for padding and gap

function EntryCard({ entry, journalId }: { entry: Entry; journalId: string }) {
  const hasPhotos = entry.media_attachments && entry.media_attachments.length > 0;
  const photos = entry.media_attachments || [];
  const contributorName = entry.participant?.display_name || 'Anonymous';
  const contributorInitial = contributorName[0]?.toUpperCase() || '?';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View style={styles.entryCard}>
      {/* Header with contributor info */}
      <View style={styles.entryHeader}>
        <View style={styles.contributorAvatar}>
          <Text style={styles.contributorInitial}>{contributorInitial}</Text>
        </View>
        <View style={styles.contributorInfo}>
          <Text style={styles.contributorName}>{contributorName}</Text>
          <Text style={styles.entryDate}>{formatDate(entry.created_at)}</Text>
        </View>
      </View>

      {/* Entry content */}
      {entry.content && (
        <Text style={styles.entryContent}>{entry.content}</Text>
      )}

      {/* Photos grid */}
      {hasPhotos && (
        <View style={styles.photosGrid}>
          {photos.slice(0, 4).map((photo, index) => (
            <View key={photo.id} style={styles.photoWrapper}>
              <Image
                source={{ uri: photo.thumbnail_url || photo.stored_url }}
                style={[
                  styles.entryPhoto,
                  photos.length === 1 && styles.singlePhoto,
                ]}
                resizeMode="cover"
              />
              {index === 3 && photos.length > 4 && (
                <View style={styles.morePhotosOverlay}>
                  <Text style={styles.morePhotosText}>+{photos.length - 4}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Reactions */}
      <ReactionBar entryId={entry.id} journalId={journalId} />

      {/* Comments */}
      <CommentSection entryId={entry.id} journalId={journalId} />
    </View>
  );
}

function EmptyEntries({ onAddPress }: { onAddPress: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <FontAwesome name="camera" size={48} color="#ccc" />
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share a memory in this journal
      </Text>
      <TouchableOpacity style={styles.addFirstButton} onPress={onAddPress}>
        <FontAwesome name="plus" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.addFirstButtonText}>Add Memory</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: journal, isLoading: journalLoading } = useJournal(id || '');
  const { data: entriesData, isLoading: entriesLoading, refetch } = useJournalEntries(id || '');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleAddEntry = () => {
    router.push(`/add-entry?journalId=${id}`);
  };

  const isLoading = journalLoading || entriesLoading;
  const entries = entriesData?.data || [];

  const getTemplateEmoji = (type: string) => {
    switch (type) {
      case 'family': return '👨‍👩‍👧‍👦';
      case 'friends': return '👯';
      case 'romantic': return '💕';
      case 'vacation': return '✈️';
      case 'retirement': return '🎉';
      default: return '📔';
    }
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <FontAwesome name="chevron-left" size={20} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>{getTemplateEmoji(journal?.template_type || 'custom')}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{journal?.title || 'Journal'}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Journal Description */}
      {journal?.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{journal.description}</Text>
        </View>
      )}

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <FontAwesome name="file-text-o" size={14} color="#666" />
          <Text style={styles.statText}>{entries.length} memories</Text>
        </View>
        <View style={styles.statItem}>
          <FontAwesome name="users" size={14} color="#666" />
          <Text style={styles.statText}>{journal?.participants?.length || 0} contributors</Text>
        </View>
      </View>

      {/* Entries List */}
      {entries.length === 0 ? (
        <EmptyEntries onAddPress={handleAddEntry} />
      ) : (
        <>
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EntryCard entry={item} journalId={id || ''} />}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#6366f1"
              />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />

          {/* Floating Action Button */}
          <TouchableOpacity style={styles.fab} onPress={handleAddEntry} activeOpacity={0.8}>
            <FontAwesome name="plus" size={24} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    maxWidth: 200,
  },
  headerRight: {
    width: 40,
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contributorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributorInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  contributorInfo: {
    marginLeft: 12,
    flex: 1,
  },
  contributorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  entryDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  entryContent: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoWrapper: {
    position: 'relative',
  },
  entryPhoto: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
  },
  singlePhoto: {
    width: '100%',
    height: 200,
  },
  morePhotosOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 24,
  },
  addFirstButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
