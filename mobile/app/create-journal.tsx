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
  Switch,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useCreateJournal, useUsageLimits } from '../hooks';
import type { TemplateType } from '../api';

const templates: { type: TemplateType; emoji: string; label: string }[] = [
  { type: 'family', emoji: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}', label: 'Family' },
  { type: 'friends', emoji: '\u{1F46F}', label: 'Friends' },
  { type: 'romantic', emoji: '\u{1F495}', label: 'Romantic' },
  { type: 'vacation', emoji: '\u2708\uFE0F', label: 'Vacation' },
  { type: 'retirement', emoji: '\u{1F389}', label: 'Celebration' },
  { type: 'custom', emoji: '\u{1F4D4}', label: 'Custom' },
];

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

export default function CreateJournalScreen() {
  const router = useRouter();
  const createJournal = useCreateJournal();
  const { data: usageLimits } = useUsageLimits();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('family');

  // Schedule settings
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [dayOfWeek, setDayOfWeek] = useState(1); // Monday
  const [promptTime, setPromptTime] = useState(new Date(2000, 0, 1, 9, 0)); // 9:00 AM
  const [timezone, setTimezone] = useState('America/New_York');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showTimezonePicker, setShowTimezonePicker] = useState(false);

  // Owner participation
  const [ownerParticipate, setOwnerParticipate] = useState(false);
  const [ownerPhone, setOwnerPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const smsEnabled = usageLimits?.smsEnabled ?? false;

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatTimeForApi = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your journal.');
      return;
    }

    // Validate phone if provided
    const phoneDigits = ownerPhone.replace(/\D/g, '');
    if (ownerParticipate && smsEnabled && phoneDigits.length > 0 && phoneDigits.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number.');
      return;
    }

    if (ownerParticipate && smsEnabled && phoneDigits.length >= 10 && !smsConsent) {
      Alert.alert('SMS Consent Required', 'Please confirm SMS consent before creating the journal.');
      return;
    }

    try {
      const journal = await createJournal.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        template_type: selectedTemplate,
        prompt_frequency: frequency,
        prompt_day_of_week: frequency !== 'daily' ? dayOfWeek : undefined,
        prompt_time: formatTimeForApi(promptTime),
        timezone,
        owner_participate: ownerParticipate || undefined,
        owner_phone: ownerParticipate && phoneDigits.length >= 10 ? `+1${phoneDigits}` : undefined,
      });

      router.replace(`/journal/${journal.id}`);
    } catch (error: any) {
      console.error('Error creating journal:', error);

      if (error.response?.status === 403) {
        Alert.alert(
          'Upgrade Required',
          'You\'ve reached the journal limit for your plan. Upgrade to Pro for unlimited journals.',
          [{ text: 'OK', style: 'cancel' }]
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

          {/* Owner Participation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participation</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Include me as a contributor</Text>
                <Text style={styles.switchHint}>You'll receive prompts and can share memories too</Text>
              </View>
              <Switch
                value={ownerParticipate}
                onValueChange={setOwnerParticipate}
                trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                thumbColor={ownerParticipate ? '#6366f1' : '#f4f4f5'}
              />
            </View>

            {ownerParticipate && smsEnabled && (
              <View style={styles.subField}>
                <Text style={styles.subFieldLabel}>Phone Number (for SMS prompts)</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={ownerPhone}
                  onChangeText={(v) => setOwnerPhone(formatPhoneNumber(v))}
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />

                {ownerPhone.replace(/\D/g, '').length >= 10 && (
                  <View style={styles.consentRow}>
                    <Switch
                      value={smsConsent}
                      onValueChange={setSmsConsent}
                      trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                      thumbColor={smsConsent ? '#6366f1' : '#f4f4f5'}
                    />
                    <Text style={styles.consentText}>
                      I agree to receive SMS messages from Keepswell at this number
                    </Text>
                  </View>
                )}
              </View>
            )}

            {ownerParticipate && !smsEnabled && (
              <View style={styles.proNotice}>
                <FontAwesome name="star" size={14} color="#d97706" />
                <Text style={styles.proNoticeText}>
                  SMS prompts require Pro. You'll access prompts through the web dashboard.
                </Text>
              </View>
            )}
          </View>

          {/* Advanced Settings */}
          <TouchableOpacity
            style={styles.advancedToggle}
            onPress={() => setShowAdvanced(!showAdvanced)}
          >
            <FontAwesome name="sliders" size={16} color="#6366f1" />
            <Text style={styles.advancedToggleText}>Prompt Schedule</Text>
            <FontAwesome
              name={showAdvanced ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#6366f1"
            />
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.section}>
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

              {/* Day of Week (not for daily) */}
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

              {/* Prompt Time */}
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
            </View>
          )}

          {/* Info Note */}
          <View style={styles.infoBox}>
            <FontAwesome name="info-circle" size={16} color="#6366f1" />
            <Text style={styles.infoText}>
              You can invite contributors and adjust settings after creating the journal.
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  switchHint: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  subField: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  subFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  fieldInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
  },
  proNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  proNoticeText: {
    flex: 1,
    fontSize: 13,
    color: '#78716c',
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eef2ff',
    borderRadius: 10,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366f1',
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
