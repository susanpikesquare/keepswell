import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import {
  useInAppPromptFeed,
  useMarkPromptResponded,
} from '../../hooks/usePrompts';
import type { InAppPromptFeedItem } from '../../api/prompts';

/**
 * "Prompts" tab — shows the user's pending in-app writing prompts across
 * every journal they're a participant in. Tapping "Respond" opens add-entry
 * pre-filled with the prompt; tapping "Dismiss" marks it answered without
 * creating an entry (it disappears from the feed either way).
 */
export default function PromptsTab() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = useInAppPromptFeed();
  const markResponded = useMarkPromptResponded();

  const handleRespond = useCallback(
    (item: InAppPromptFeedItem) => {
      if (!item.journalId) {
        Alert.alert('Prompt unavailable', 'This prompt is no longer linked to a journal.');
        return;
      }
      // add-entry will mark the prompt responded after a successful save.
      router.push({
        pathname: '/add-entry',
        params: {
          journalId: item.journalId,
          promptSendId: item.promptSendId,
          promptText: item.promptText ?? '',
        },
      });
    },
    [router],
  );

  const handleDismiss = useCallback(
    (item: InAppPromptFeedItem) => {
      Alert.alert(
        'Dismiss prompt?',
        "We'll stop showing this prompt in your feed. You can still write about it later.",
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Dismiss',
            style: 'destructive',
            onPress: () => {
              markResponded.mutate(item.promptSendId);
            },
          },
        ],
      );
    },
    [markResponded],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D86F5C" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header />
        <View style={styles.centered}>
          <FontAwesome name="exclamation-triangle" size={32} color="#999" />
          <Text style={styles.errorText}>Couldn't load your prompts</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const items = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header />
      <FlatList
        data={items}
        keyExtractor={(item) => item.promptSendId}
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#D86F5C"
          />
        }
        renderItem={({ item }) => (
          <PromptCard
            item={item}
            onRespond={() => handleRespond(item)}
            onDismiss={() => handleDismiss(item)}
            dismissing={markResponded.isPending}
          />
        )}
        ListEmptyComponent={<Empty />}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Prompts</Text>
      <Text style={styles.headerSubtitle}>Writing prompts waiting for you</Text>
    </View>
  );
}

function PromptCard({
  item,
  onRespond,
  onDismiss,
  dismissing,
}: {
  item: InAppPromptFeedItem;
  onRespond: () => void;
  onDismiss: () => void;
  dismissing: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <FontAwesome name="comment-o" size={14} color="#D86F5C" />
        <Text style={styles.cardJournal} numberOfLines={1}>
          {item.journalTitle ?? 'Untitled journal'}
        </Text>
        {item.promptCategory ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryPillText}>{item.promptCategory}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardPrompt}>{item.promptText ?? '…'}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.respondBtn}
          onPress={onRespond}
          activeOpacity={0.8}
        >
          <FontAwesome name="pencil" size={14} color="#fff" />
          <Text style={styles.respondText}>Respond</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={onDismiss}
          disabled={dismissing}
        >
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.emptyContainer}>
      <FontAwesome name="inbox" size={56} color="#ccc" />
      <Text style={styles.emptyTitle}>No prompts right now</Text>
      <Text style={styles.emptySubtitle}>
        When new writing prompts arrive for any of your journals, you'll see
        them here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F1EA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    fontFamily: 'PlayfairDisplay_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { color: '#666', fontSize: 15 },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#D86F5C',
    borderRadius: 18,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardJournal: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPill: {
    backgroundColor: '#F6F1EA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryPillText: {
    fontSize: 11,
    color: '#D86F5C',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  cardPrompt: {
    fontSize: 17,
    lineHeight: 24,
    color: '#1a1a1a',
    fontFamily: 'PlayfairDisplay_400Regular_Italic',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  respondBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D86F5C',
    paddingVertical: 12,
    borderRadius: 22,
    gap: 8,
  },
  respondText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  dismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dismissText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
});
