import { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';

import { useUpdateJournal, useDeleteJournal } from '../hooks';
import { PromptOrderSection } from './PromptOrderSection';
import type { Journal } from '../api';

// SMS phone number (Telnyx number)
const SMS_PHONE_NUMBER = '+1 (916) 439-8709';

// Cover image templates - using Unsplash for high-quality free images
const COVER_TEMPLATES = [
  {
    id: 'family-1',
    name: 'Warm Sunset',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=400&fit=crop',
  },
  {
    id: 'family-2',
    name: 'Cozy Home',
    url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&h=400&fit=crop',
  },
  {
    id: 'nature-1',
    name: 'Mountain View',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
  },
  {
    id: 'nature-2',
    name: 'Ocean Waves',
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1200&h=400&fit=crop',
  },
  {
    id: 'minimal-1',
    name: 'Soft Gradient',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
  },
  {
    id: 'minimal-2',
    name: 'Abstract',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=400&fit=crop',
  },
  {
    id: 'floral-1',
    name: 'Spring Flowers',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&h=400&fit=crop',
  },
  {
    id: 'vintage-1',
    name: 'Vintage Paper',
    url: 'https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?w=1200&h=400&fit=crop',
  },
];

interface JournalSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  journal: Journal;
}

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
] as const;

const DAY_OPTIONS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export function JournalSettingsModal({ visible, onClose, journal }: JournalSettingsModalProps) {
  const router = useRouter();
  const updateJournal = useUpdateJournal();
  const deleteJournal = useDeleteJournal();

  // Schedule state
  const [frequency, setFrequency] = useState(journal.prompt_frequency);
  const [dayOfWeek, setDayOfWeek] = useState(journal.prompt_day_of_week ?? 1);
  const [promptTime, setPromptTime] = useState(() => {
    const [h, m] = (journal.prompt_time || '09:00').split(':').map(Number);
    return new Date(2000, 0, 1, h, m);
  });
  const [timezone, setTimezone] = useState(journal.timezone || 'America/New_York');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);
  const [scheduleChanged, setScheduleChanged] = useState(false);

  // SMS copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Cover image state
  const [coverImage, setCoverImage] = useState(journal.cover_image_url || '');
  const [customUrl, setCustomUrl] = useState('');
  const [coverChanged, setCoverChanged] = useState(false);

  // Delete state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Reset state when journal changes
  useEffect(() => {
    setFrequency(journal.prompt_frequency);
    setDayOfWeek(journal.prompt_day_of_week ?? 1);
    const [h, m] = (journal.prompt_time || '09:00').split(':').map(Number);
    setPromptTime(new Date(2000, 0, 1, h, m));
    setTimezone(journal.timezone || 'America/New_York');
    setScheduleChanged(false);
    setDeleteConfirmText('');
    setCopiedField(null);
    setCoverImage(journal.cover_image_url || '');
    setCustomUrl('');
    setCoverChanged(false);
  }, [journal.id, visible]);

  // Track changes
  useEffect(() => {
    const timeStr = `${promptTime.getHours().toString().padStart(2, '0')}:${promptTime.getMinutes().toString().padStart(2, '0')}`;
    const changed =
      frequency !== journal.prompt_frequency ||
      dayOfWeek !== (journal.prompt_day_of_week ?? 1) ||
      timeStr !== (journal.prompt_time || '09:00') ||
      timezone !== (journal.timezone || 'America/New_York');
    setScheduleChanged(changed);
  }, [frequency, dayOfWeek, promptTime, timezone, journal]);

  // Track cover image changes
  useEffect(() => {
    setCoverChanged(coverImage !== (journal.cover_image_url || ''));
  }, [coverImage, journal.cover_image_url]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      Alert.alert('Error', 'Failed to copy to clipboard.');
    }
  };

  const handleSaveCover = async () => {
    try {
      await updateJournal.mutateAsync({
        id: journal.id,
        data: { cover_image_url: coverImage || null },
      });
      setCoverChanged(false);
      Alert.alert('Saved', 'Cover image updated.');
    } catch {
      Alert.alert('Error', 'Failed to update cover image.');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const handleSaveSchedule = async () => {
    try {
      const timeStr = `${promptTime.getHours().toString().padStart(2, '0')}:${promptTime.getMinutes().toString().padStart(2, '0')}`;
      await updateJournal.mutateAsync({
        id: journal.id,
        data: {
          prompt_frequency: frequency,
          prompt_day_of_week: frequency !== 'daily' ? dayOfWeek : undefined,
          prompt_time: timeStr,
          timezone,
        },
      });
      setScheduleChanged(false);
      Alert.alert('Saved', 'Prompt schedule updated.');
    } catch {
      Alert.alert('Error', 'Failed to update schedule.');
    }
  };

  const handleDelete = () => {
    if (deleteConfirmText !== journal.title) {
      Alert.alert('Confirmation Required', 'Please type the journal title exactly to confirm deletion.');
      return;
    }

    Alert.alert(
      'Delete Journal',
      'This action cannot be undone. All entries, photos, and data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteJournal.mutateAsync(journal.id);
              onClose();
              router.replace('/(tabs)');
            } catch {
              Alert.alert('Error', 'Failed to delete journal.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <SafeAreaView style={styles.safeHeader}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Journal Settings</Text>
            <View style={{ width: 50 }} />
          </View>
        </SafeAreaView>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          bounces={true}
          nestedScrollEnabled={true}
        >
          {/* SMS Join Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SMS Join Info</Text>

            <Text style={styles.fieldLabel}>SMS Number</Text>
            <View style={styles.copyRow}>
              <Text style={styles.copyText}>{SMS_PHONE_NUMBER}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopy(SMS_PHONE_NUMBER.replace(/\D/g, ''), 'phone')}
              >
                <FontAwesome
                  name={copiedField === 'phone' ? 'check' : 'copy'}
                  size={14}
                  color={copiedField === 'phone' ? '#22c55e' : '#6366f1'}
                />
                <Text style={[styles.copyButtonText, copiedField === 'phone' && styles.copiedText]}>
                  {copiedField === 'phone' ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            {journal.join_keyword && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Join Keyword</Text>
                <View style={styles.copyRow}>
                  <Text style={styles.copyText}>JOIN {journal.join_keyword}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopy(`JOIN ${journal.join_keyword}`, 'keyword')}
                  >
                    <FontAwesome
                      name={copiedField === 'keyword' ? 'check' : 'copy'}
                      size={14}
                      color={copiedField === 'keyword' ? '#22c55e' : '#6366f1'}
                    />
                    <Text style={[styles.copyButtonText, copiedField === 'keyword' && styles.copiedText]}>
                      {copiedField === 'keyword' ? 'Copied!' : 'Copy'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsText}>
                    Text <Text style={{ fontWeight: '700' }}>JOIN {journal.join_keyword}</Text> to{' '}
                    <Text style={{ fontWeight: '700' }}>{SMS_PHONE_NUMBER}</Text>
                  </Text>
                  <TouchableOpacity
                    style={styles.copyInstructionsButton}
                    onPress={() =>
                      handleCopy(
                        `Text JOIN ${journal.join_keyword} to ${SMS_PHONE_NUMBER}`,
                        'instructions'
                      )
                    }
                  >
                    <FontAwesome
                      name={copiedField === 'instructions' ? 'check' : 'copy'}
                      size={14}
                      color="#fff"
                    />
                    <Text style={styles.copyInstructionsText}>
                      {copiedField === 'instructions' ? 'Copied!' : 'Copy Instructions'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* Cover Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cover Image</Text>

            {/* Current cover preview */}
            {coverImage ? (
              <View style={styles.coverPreviewContainer}>
                <Image
                  source={{ uri: coverImage }}
                  style={styles.coverPreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.coverRemoveButton}
                  onPress={() => setCoverImage('')}
                >
                  <FontAwesome name="times" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.coverPlaceholder}>
                <FontAwesome name="image" size={32} color="#ccc" />
                <Text style={styles.coverPlaceholderText}>No cover image</Text>
              </View>
            )}

            {/* Template picker */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Templates</Text>
            <View style={styles.templateGrid}>
              {COVER_TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateItem,
                    coverImage === template.url && styles.templateItemSelected,
                  ]}
                  onPress={() => setCoverImage(template.url)}
                >
                  <Image
                    source={{ uri: template.url }}
                    style={styles.templateImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.templateName} numberOfLines={1}>
                    {template.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom URL input */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Custom URL</Text>
            <View style={styles.customUrlRow}>
              <TextInput
                style={styles.customUrlInput}
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="https://example.com/image.jpg"
                placeholderTextColor="#aaa"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <TouchableOpacity
                style={[styles.customUrlButton, !customUrl && styles.customUrlButtonDisabled]}
                onPress={() => {
                  if (customUrl) {
                    setCoverImage(customUrl);
                    setCustomUrl('');
                  }
                }}
                disabled={!customUrl}
              >
                <Text style={styles.customUrlButtonText}>Use</Text>
              </TouchableOpacity>
            </View>

            {/* Save button */}
            {coverChanged && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCover}
                disabled={updateJournal.isPending}
              >
                {updateJournal.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Cover Image</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Prompt Order Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prompts</Text>
            <Text style={styles.promptDescription}>
              Manage your prompts and their delivery order. Move prompts up or down to change the order they'll be sent.
            </Text>
            <PromptOrderSection journalId={journal.id} />
          </View>

          {/* Prompt Schedule Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prompt Schedule</Text>

            {/* Frequency */}
            <Text style={styles.fieldLabel}>Frequency</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
            >
              <Text style={styles.pickerButtonText}>
                {FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label}
              </Text>
              <FontAwesome name={showFrequencyPicker ? 'chevron-up' : 'chevron-down'} size={12} color="#666" />
            </TouchableOpacity>
            {showFrequencyPicker && (
              <View style={styles.optionsList}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionItem, frequency === opt.value && styles.optionItemSelected]}
                    onPress={() => { setFrequency(opt.value); setShowFrequencyPicker(false); }}
                  >
                    <Text style={[styles.optionText, frequency === opt.value && styles.optionTextSelected]}>
                      {opt.label}
                    </Text>
                    {frequency === opt.value && <FontAwesome name="check" size={14} color="#6366f1" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Day of Week */}
            {frequency !== 'daily' && (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Day of Week</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowDayPicker(!showDayPicker)}
                >
                  <Text style={styles.pickerButtonText}>
                    {DAY_OPTIONS.find((d) => d.value === dayOfWeek)?.label}
                  </Text>
                  <FontAwesome name={showDayPicker ? 'chevron-up' : 'chevron-down'} size={12} color="#666" />
                </TouchableOpacity>
                {showDayPicker && (
                  <View style={styles.optionsList}>
                    {DAY_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt.value}
                        style={[styles.optionItem, dayOfWeek === opt.value && styles.optionItemSelected]}
                        onPress={() => { setDayOfWeek(opt.value); setShowDayPicker(false); }}
                      >
                        <Text style={[styles.optionText, dayOfWeek === opt.value && styles.optionTextSelected]}>
                          {opt.label}
                        </Text>
                        {dayOfWeek === opt.value && <FontAwesome name="check" size={14} color="#6366f1" />}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* Time */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Prompt Time</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Text style={styles.pickerButtonText}>{formatTime(promptTime)}</Text>
              <FontAwesome name="clock-o" size={16} color="#666" />
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={promptTime}
                mode="time"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setPromptTime(date);
                }}
                style={{ height: 150 }}
              />
            )}

            {/* Timezone */}
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Timezone</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimezonePicker(!showTimezonePicker)}
            >
              <Text style={styles.pickerButtonText}>
                {TIMEZONE_OPTIONS.find((tz) => tz.value === timezone)?.label}
              </Text>
              <FontAwesome name={showTimezonePicker ? 'chevron-up' : 'chevron-down'} size={12} color="#666" />
            </TouchableOpacity>
            {showTimezonePicker && (
              <View style={styles.optionsList}>
                {TIMEZONE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.optionItem, timezone === opt.value && styles.optionItemSelected]}
                    onPress={() => { setTimezone(opt.value); setShowTimezonePicker(false); }}
                  >
                    <Text style={[styles.optionText, timezone === opt.value && styles.optionTextSelected]}>
                      {opt.label}
                    </Text>
                    {timezone === opt.value && <FontAwesome name="check" size={14} color="#6366f1" />}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Save Button */}
            {scheduleChanged && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSchedule}
                disabled={updateJournal.isPending}
              >
                {updateJournal.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Schedule</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Danger Zone */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
            <Text style={styles.dangerDescription}>
              Deleting a journal permanently removes all entries, photos, and participant data. This cannot be undone.
            </Text>
            <Text style={styles.dangerConfirmLabel}>
              Type "{journal.title}" to confirm:
            </Text>
            <TextInput
              style={styles.dangerInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder={journal.title}
              placeholderTextColor="#ccc"
            />
            <TouchableOpacity
              style={[
                styles.deleteButton,
                deleteConfirmText !== journal.title && styles.deleteButtonDisabled,
              ]}
              onPress={handleDelete}
              disabled={deleteConfirmText !== journal.title || deleteJournal.isPending}
            >
              {deleteJournal.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="trash-o" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.deleteButtonText}>Delete Journal</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeHeader: {
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
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
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  optionsList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginTop: 8,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#eef2ff',
  },
  optionText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  optionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  promptDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  copyText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
  },
  copiedText: {
    color: '#22c55e',
  },
  instructionsBox: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 15,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 12,
  },
  copyInstructionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  copyInstructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  coverPreviewContainer: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  coverRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholder: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPlaceholderText: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  templateItem: {
    width: '47%',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateItemSelected: {
    borderColor: '#6366f1',
  },
  templateImage: {
    width: '100%',
    height: 60,
  },
  templateName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 4,
    backgroundColor: '#f9fafb',
  },
  customUrlRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  customUrlInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  customUrlButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  customUrlButtonDisabled: {
    opacity: 0.4,
  },
  customUrlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  dangerSection: {
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  dangerConfirmLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dangerInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
