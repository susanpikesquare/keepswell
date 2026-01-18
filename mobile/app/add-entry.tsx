import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';

import { useCreateEntry, useImagePicker } from '../hooks';
import { uploadMultipleToCloudinary } from '../lib/cloudinary';

export default function AddEntryScreen() {
  const { journalId } = useLocalSearchParams<{ journalId: string }>();
  const router = useRouter();
  const createEntry = useCreateEntry(journalId || '');
  const { images, pickImages, takePhoto, removeImage, clearImages } = useImagePicker();

  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickImages = async () => {
    await pickImages(10);
  };

  const handleTakePhoto = async () => {
    await takePhoto();
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      Alert.alert('Empty Entry', 'Please add some text or photos to your memory.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let mediaUrls: string[] = [];

      // Upload images to Cloudinary if any
      if (images.length > 0) {
        const imageUris = images.map((img) => img.uri);
        mediaUrls = await uploadMultipleToCloudinary(imageUris, (index, progress) => {
          const overallProgress = ((index + progress.progress) / images.length) * 100;
          setUploadProgress(Math.round(overallProgress));
        });
      }

      // Create the entry
      await createEntry.mutateAsync({
        content: content.trim() || undefined,
        media_urls: mediaUrls.length > 0 ? mediaUrls : undefined,
      });

      // Clear form and navigate back
      clearImages();
      setContent('');
      router.back();
    } catch (error) {
      console.error('Error creating entry:', error);
      Alert.alert(
        'Error',
        'Failed to create your memory. Please try again.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const canSubmit = (content.trim() || images.length > 0) && !isUploading;

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
            disabled={isUploading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Memory</Text>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>Share</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Upload Progress */}
        {isUploading && images.length > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>Uploading photos... {uploadProgress}%</Text>
          </View>
        )}

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="Share a memory, thought, or story..."
            placeholderTextColor="#999"
            multiline
            value={content}
            onChangeText={setContent}
            editable={!isUploading}
          />

          {/* Selected Photos */}
          {images.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.photosSectionTitle}>
                Photos ({images.length})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.photosScroll}
              >
                {images.map((image) => (
                  <View key={image.uri} style={styles.photoWrapper}>
                    <Image source={{ uri: image.uri }} style={styles.photoPreview} />
                    {!isUploading && (
                      <TouchableOpacity
                        style={styles.removePhotoButton}
                        onPress={() => removeImage(image.uri)}
                      >
                        <FontAwesome name="times-circle" size={24} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Photo Actions */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePickImages}
            disabled={isUploading}
          >
            <FontAwesome
              name="image"
              size={24}
              color={isUploading ? '#ccc' : '#6366f1'}
            />
            <Text style={[styles.actionText, isUploading && styles.actionTextDisabled]}>
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleTakePhoto}
            disabled={isUploading}
          >
            <FontAwesome
              name="camera"
              size={24}
              color={isUploading ? '#ccc' : '#6366f1'}
            />
            <Text style={[styles.actionText, isUploading && styles.actionTextDisabled]}>
              Camera
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
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
  submitButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    minWidth: 70,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#c7d2fe',
  },
  submitText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e5e5',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  progressText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  textInput: {
    padding: 16,
    fontSize: 17,
    lineHeight: 24,
    minHeight: 150,
    textAlignVertical: 'top',
    color: '#1a1a1a',
  },
  photosSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  photosSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  photosScroll: {
    flexDirection: 'row',
  },
  photoWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '500',
  },
  actionTextDisabled: {
    color: '#ccc',
  },
});
