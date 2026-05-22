import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { useJournal } from '../../hooks';
import { JournalSettingsModal } from '../../components/JournalSettingsModal';

export default function JournalSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: journal, isLoading } = useJournal(id || '');

  if (isLoading || !journal) {
    return (
      <View style={styles.loading}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <JournalSettingsModal onClose={() => router.back()} journal={journal} />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
