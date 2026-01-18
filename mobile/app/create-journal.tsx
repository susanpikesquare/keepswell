import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import { useCreateJournal } from '../hooks';
import type { TemplateType } from '../api';

const templates: { type: TemplateType; emoji: string; label: string }[] = [
  { type: 'family', emoji: '👨‍👩‍👧‍👦', label: 'Family' },
  { type: 'friends', emoji: '👯', label: 'Friends' },
  { type: 'romantic', emoji: '💕', label: 'Romantic' },
  { type: 'vacation', emoji: '✈️', label: 'Vacation' },
  { type: 'retirement', emoji: '🎉', label: 'Celebration' },
  { type: 'custom', emoji: '📔', label: 'Custom' },
];

export default function CreateJournalScreen() {
  const router = useRouter();
  const createJournal = useCreateJournal();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('family');

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your journal.');
      return;
    }

    try {
      const journal = await createJournal.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        template_type: selectedTemplate,
      });

      // Navigate to the new journal
      router.replace(`/journal/${journal.id}`);
    } catch (error: any) {
      console.error('Error creating journal:', error);

      // Check for limit reached error
      if (error.response?.status === 403) {
        Alert.alert(
          'Upgrade Required',
          'You\'ve reached the journal limit for your plan. Upgrade to Pro for unlimited journals.',
          [
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to create journal. Please try again.');
      }
    }
  };

  const canSubmit = title.trim() && !createJournal.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={createJournal.isPending}
          >
            <FontAwesome name="chevron-left" size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Journal</Text>
          <TouchableOpacity
            style={[styles.createButton, !canSubmit && styles.createButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {createJournal.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Template Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Template</Text>
            <View style={styles.templatesGrid}>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.type}
                  style={[
                    styles.templateCard,
                    selectedTemplate === template.type && styles.templateCardSelected,
                  ]}
                  onPress={() => setSelectedTemplate(template.type)}
                >
                  <Text style={styles.templateEmoji}>{template.emoji}</Text>
                  <Text
                    style={[
                      styles.templateLabel,
                      selectedTemplate === template.type && styles.templateLabelSelected,
                    ]}
                  >
                    {template.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Journal Title</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="Enter a title..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!createJournal.isPending}
            />
          </View>

          {/* Description Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description (Optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="What's this journal about?"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
              editable={!createJournal.isPending}
            />
          </View>

          {/* Info Note */}
          <View style={styles.infoBox}>
            <FontAwesome name="info-circle" size={16} color="#6366f1" />
            <Text style={styles.infoText}>
              You can invite contributors and configure prompts after creating the journal.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  createButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  templateEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  templateLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  templateLabelSelected: {
    color: '#6366f1',
  },
  titleInput: {
    fontSize: 17,
    color: '#1a1a1a',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  descriptionInput: {
    fontSize: 16,
    color: '#1a1a1a',
    paddingVertical: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#e0e7ff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4338ca',
    lineHeight: 20,
  },
});
