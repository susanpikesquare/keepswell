import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import { useInviteParticipant, useParticipants, useUsageLimits } from '../hooks';

interface InviteParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  journalId: string;
}

const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Grandparent',
  'Child',
  'Sibling',
  'Spouse',
  'Partner',
  'Friend',
  'Aunt/Uncle',
  'Cousin',
  'Other',
];

export function InviteParticipantModal({ visible, onClose, journalId }: InviteParticipantModalProps) {
  const inviteParticipant = useInviteParticipant();
  const { data: participants } = useParticipants(journalId);
  const { data: usageLimits } = useUsageLimits();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [error, setError] = useState('');
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);

  const isPro = usageLimits?.isPro ?? false;
  const smsEnabled = usageLimits?.smsEnabled ?? false;
  const maxContributors = isPro ? 15 : 3;
  const currentContributorCount = participants?.length ?? 0;
  const hasReachedContributorLimit = currentContributorCount >= maxContributors;

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhoneNumber(formatPhoneNumber(value));
  };

  const handleSubmit = async () => {
    setError('');

    if (!displayName.trim()) {
      setError('Please enter a name');
      return;
    }

    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (smsEnabled && digits.length >= 10 && !smsConsent) {
      setError('Please confirm SMS consent before inviting');
      return;
    }

    try {
      await inviteParticipant.mutateAsync({
        journalId,
        data: {
          phone_number: digits.length >= 10 ? `+1${digits}` : undefined,
          display_name: displayName.trim(),
          relationship: relationship || undefined,
          email: email || undefined,
        },
      });
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite participant');
    }
  };

  const handleClose = () => {
    setPhoneNumber('');
    setDisplayName('');
    setRelationship('');
    setEmail('');
    setSmsConsent(false);
    setError('');
    setShowRelationshipPicker(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Invite Participant</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Add someone to receive prompts and share memories
            </Text>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <FontAwesome name="exclamation-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Contributor Limit Warning */}
            {hasReachedContributorLimit && (
              <View style={styles.warningBox}>
                <FontAwesome name="exclamation-triangle" size={16} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>Contributor limit reached</Text>
                  <Text style={styles.warningText}>
                    You've reached the maximum of {maxContributors} contributors
                    {!isPro ? ' on the free plan. Upgrade to Pro for up to 15 contributors per journal.' : '.'}
                  </Text>
                </View>
              </View>
            )}

            {/* Contributor Count */}
            {!hasReachedContributorLimit && (
              <View style={styles.countBar}>
                <Text style={styles.countLabel}>Contributors</Text>
                <Text style={styles.countValue}>{currentContributorCount} / {maxContributors}</Text>
              </View>
            )}

            {/* Phone Number Field (SMS enabled) */}
            {smsEnabled ? (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
                <Text style={styles.fieldHint}>Optional - provide to send SMS prompts</Text>
              </View>
            ) : (
              <View style={styles.proBox}>
                <FontAwesome name="star" size={16} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.proTitle}>SMS prompts require Pro</Text>
                  <Text style={styles.proText}>
                    This contributor will access prompts through the web dashboard. Upgrade to Pro to enable SMS prompts.
                  </Text>
                </View>
              </View>
            )}

            {/* Display Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput
                style={styles.fieldInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Mom, Dad, Grandma..."
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
            </View>

            {/* Relationship */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Relationship</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowRelationshipPicker(!showRelationshipPicker)}
              >
                <Text style={[styles.pickerButtonText, !relationship && styles.pickerPlaceholder]}>
                  {relationship || 'Select relationship (optional)'}
                </Text>
                <FontAwesome
                  name={showRelationshipPicker ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color="#666"
                />
              </TouchableOpacity>
              {showRelationshipPicker && (
                <View style={styles.pickerList}>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.pickerOption,
                        relationship === rel && styles.pickerOptionSelected,
                      ]}
                      onPress={() => {
                        setRelationship(relationship === rel ? '' : rel);
                        setShowRelationshipPicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          relationship === rel && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {rel}
                      </Text>
                      {relationship === rel && (
                        <FontAwesome name="check" size={14} color="#6366f1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email (optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.fieldHint}>For sending a link to view the memory book</Text>
            </View>

            {/* SMS Consent */}
            {smsEnabled && phoneNumber.replace(/\D/g, '').length >= 10 && (
              <View style={styles.consentBox}>
                <View style={styles.consentRow}>
                  <Switch
                    value={smsConsent}
                    onValueChange={setSmsConsent}
                    trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
                    thumbColor={smsConsent ? '#6366f1' : '#f4f4f5'}
                  />
                  <Text style={styles.consentLabel}>
                    I confirm this person has agreed to receive SMS messages from Keepswell
                  </Text>
                </View>
                <Text style={styles.consentDetail}>
                  By inviting this person, you confirm they have agreed to receive text messages
                  from Keepswell (a service of PikeSquare, LLC) at the phone number provided.
                  Message frequency varies. Message and data rates may apply. They can reply STOP
                  to opt out.
                </Text>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (inviteParticipant.isPending || hasReachedContributorLimit) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={inviteParticipant.isPending || hasReachedContributorLimit}
            >
              {inviteParticipant.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <FontAwesome name="user-plus" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Add Contributor</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#ef4444',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  warningText: {
    fontSize: 13,
    color: '#78716c',
    marginTop: 2,
  },
  countBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  countLabel: {
    fontSize: 13,
    color: '#666',
  },
  countValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  proBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  proTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  proText: {
    fontSize: 13,
    color: '#78716c',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  fieldHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 2,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
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
  pickerPlaceholder: {
    color: '#999',
  },
  pickerList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    marginTop: 8,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionSelected: {
    backgroundColor: '#eef2ff',
  },
  pickerOptionText: {
    fontSize: 15,
    color: '#1a1a1a',
  },
  pickerOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  consentBox: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consentLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  consentDetail: {
    fontSize: 11,
    color: '#999',
    marginTop: 10,
    lineHeight: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
