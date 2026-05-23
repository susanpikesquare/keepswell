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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import { useJournal, useJournalEntries, useParticipants, useRemoveParticipant, useApproveParticipant, useDeclineParticipant, useUpdateParticipant } from '../../hooks';
import { ReactionBar } from '../../components/ReactionBar';
import { CommentSection } from '../../components/CommentSection';
import { InviteParticipantModal } from '../../components/InviteParticipantModal';
import type { Entry, Participant } from '../../api';

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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#dcfce7', text: '#166534' },
  pending: { bg: '#fef9c3', text: '#854d0e' },
  paused: { bg: '#e5e5e5', text: '#666' },
  removed: { bg: '#fecaca', text: '#991b1b' },
};

function ParticipantRow({
  participant,
  isOwner,
  journalId,
}: {
  participant: Participant;
  isOwner: boolean;
  journalId: string;
}) {
  const initial = participant.display_name[0]?.toUpperCase() || '?';
  const statusColor = STATUS_COLORS[participant.status] || STATUS_COLORS.pending;
  const removeParticipant = useRemoveParticipant();
  const approveParticipant = useApproveParticipant();
  const declineParticipant = useDeclineParticipant();
  const updateParticipant = useUpdateParticipant();
  const channel = participant.delivery_channel ?? 'sms';

  const handleActions = () => {
    const buttons: Array<{ text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }> = [];

    if (participant.status === 'pending' && isOwner) {
      buttons.push({
        text: 'Approve',
        onPress: () => approveParticipant.mutate({ id: participant.id, journalId }),
      });
      buttons.push({
        text: 'Decline',
        style: 'destructive',
        onPress: () => declineParticipant.mutate({ id: participant.id, journalId }),
      });
    }

    if (isOwner && participant.status !== 'removed') {
      buttons.push({
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Remove Participant',
            `Remove ${participant.display_name} from this journal?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: () => removeParticipant.mutate({ id: participant.id, journalId }),
              },
            ]
          );
        },
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    if (buttons.length > 1) {
      Alert.alert(participant.display_name, participant.relationship || undefined, buttons);
    }
  };

  // Only show the delivery-channel chooser for active participants when the
  // current user owns the journal. Pending / removed participants don't get
  // prompts yet, so the control would be noise.
  const showChannelChooser = isOwner && participant.status === 'active';

  const setChannel = (next: 'sms' | 'in_app' | 'both') => {
    if (next === channel) return;
    updateParticipant.mutate({
      id: participant.id,
      journalId,
      data: { delivery_channel: next },
    });
  };

  return (
    <View style={styles.participantRow}>
      <TouchableOpacity
        style={styles.participantRowMain}
        onPress={isOwner ? handleActions : undefined}
        activeOpacity={isOwner ? 0.7 : 1}
      >
        <View style={styles.participantAvatar}>
          <Text style={styles.participantInitial}>{initial}</Text>
        </View>
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>{participant.display_name}</Text>
          {participant.relationship && (
            <Text style={styles.participantRelationship}>{participant.relationship}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {participant.status}
          </Text>
        </View>
      </TouchableOpacity>

      {showChannelChooser && (
        <View style={styles.channelChooser}>
          <Text style={styles.channelLabel}>Prompt delivery</Text>
          <View style={styles.channelSegments}>
            <ChannelSegment
              label="SMS"
              active={channel === 'sms'}
              disabled={updateParticipant.isPending || !participant.phone_number}
              onPress={() => setChannel('sms')}
            />
            <ChannelSegment
              label="In-app"
              active={channel === 'in_app'}
              disabled={updateParticipant.isPending}
              onPress={() => setChannel('in_app')}
            />
            <ChannelSegment
              label="Both"
              active={channel === 'both'}
              disabled={updateParticipant.isPending || !participant.phone_number}
              onPress={() => setChannel('both')}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ChannelSegment({
  label,
  active,
  disabled,
  onPress,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.channelSegment,
        active && styles.channelSegmentActive,
        disabled && !active && styles.channelSegmentDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.channelSegmentText,
          active && styles.channelSegmentTextActive,
          disabled && !active && styles.channelSegmentTextDisabled,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: journal, isLoading: journalLoading } = useJournal(id || '');
  const { data: entriesData, isLoading: entriesLoading, refetch } = useJournalEntries(id || '');
  const { data: participants, refetch: refetchParticipants } = useParticipants(id || '');
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refetchParticipants()]);
    setRefreshing(false);
  }, [refetch, refetchParticipants]);

  const handleAddEntry = () => {
    router.push(`/add-entry?journalId=${id}`);
  };

  const isLoading = journalLoading || entriesLoading;
  const entries = entriesData?.data || [];
  const isOwner = true; // The mobile app user is typically the journal owner

  const getTemplateEmoji = (type: string) => {
    switch (type) {
      case 'family': return '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}';
      case 'friends': return '\u{1F46F}';
      case 'romantic': return '\u{1F495}';
      case 'vacation': return '\u2708\uFE0F';
      case 'retirement': return '\u{1F389}';
      default: return '\u{1F4D4}';
    }
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D86F5C" />
          <Text style={styles.loadingText}>Loading journal...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const participantList = participants || journal?.participants || [];

  const ListHeader = () => (
    <>
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
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => setShowParticipants(!showParticipants)}
        >
          <FontAwesome name="users" size={14} color="#666" />
          <Text style={styles.statText}>{participantList.length} contributors</Text>
          <FontAwesome
            name={showParticipants ? 'chevron-up' : 'chevron-down'}
            size={10}
            color="#999"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setInviteModalVisible(true)}
        >
          <FontAwesome name="user-plus" size={12} color="#D86F5C" />
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Participant List (expandable) */}
      {showParticipants && participantList.length > 0 && (
        <View style={styles.participantSection}>
          {participantList.map((p) => (
            <ParticipantRow
              key={p.id}
              participant={p}
              isOwner={isOwner}
              journalId={id || ''}
            />
          ))}
        </View>
      )}
    </>
  );

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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push(`/journal-book/${id}`)}
          >
            <FontAwesome name="book" size={16} color="#D86F5C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setInviteModalVisible(true)}
          >
            <FontAwesome name="user-plus" size={16} color="#D86F5C" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push(`/journal-settings/${id}`)}
          >
            <FontAwesome name="cog" size={18} color="#D86F5C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Entries List */}
      {entries.length === 0 && !showParticipants ? (
        <>
          <ListHeader />
          <EmptyEntries onAddPress={handleAddEntry} />
        </>
      ) : (
        <>
          <FlatList
            style={{ flex: 1 }}
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <EntryCard entry={item} journalId={id || ''} />}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#D86F5C"
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

      {/* Invite Modal */}
      <InviteParticipantModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        journalId={id || ''}
      />

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    alignItems: 'center',
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
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
    backgroundColor: '#F6F1EA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#D86F5C',
  },
  participantSection: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingVertical: 4,
  },
  participantRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  participantRowMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelChooser: {
    marginTop: 10,
    marginLeft: 48, // align with name (avatar width + spacing)
  },
  channelLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  channelSegments: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  channelSegment: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  channelSegmentActive: {
    backgroundColor: '#D86F5C',
  },
  channelSegmentDisabled: {
    backgroundColor: '#f5f5f5',
  },
  channelSegmentText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  channelSegmentTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  channelSegmentTextDisabled: {
    color: '#ccc',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCCCB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D86F5C',
  },
  participantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  participantRelationship: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
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
    paddingTop: 16,
    paddingBottom: 100,
  },
  entryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
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
    backgroundColor: '#DCCCB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contributorInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D86F5C',
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
    backgroundColor: '#D86F5C',
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
    backgroundColor: '#D86F5C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D86F5C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
