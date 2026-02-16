import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export interface SelectedImage {
  uri: string;
  width: number;
  height: number;
  type?: string;
  fileName?: string;
}

export function useImagePicker() {
  const [images, setImages] = useState<SelectedImage[]>([]);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable photo library access in Settings to select photos.'
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable camera access in Settings to take photos.'
      );
      return false;
    }
    return true;
  };

  const pickImages = async (maxCount = 10): Promise<SelectedImage[] | null> => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const remainingSlots = maxCount - images.length;
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `You can only add up to ${maxCount} photos.`);
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: remainingSlots,
    });

    if (result.canceled) return null;

    const selectedImages: SelectedImage[] = result.assets.map((asset) => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName ?? undefined,
    }));

    setImages((prev) => [...prev, ...selectedImages]);
    return selectedImages;
  };

  const takePhoto = async (): Promise<SelectedImage | null> => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    const photo: SelectedImage = {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.mimeType || 'image/jpeg',
      fileName: asset.fileName ?? undefined,
    };

    setImages((prev) => [...prev, photo]);
    return photo;
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  const clearImages = () => {
    setImages([]);
  };

  return {
    images,
    pickImages,
    takePhoto,
    removeImage,
    clearImages,
    setImages,
  };
}
