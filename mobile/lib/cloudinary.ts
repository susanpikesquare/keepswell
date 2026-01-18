const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'keepswell_mobile';

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

interface UploadProgress {
  loaded: number;
  total: number;
  progress: number;
}

export async function uploadToCloudinary(
  uri: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  const cloudName = CLOUDINARY_CLOUD_NAME;
  const uploadPreset = CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name not configured');
  }

  // Extract filename from URI
  const uriParts = uri.split('/');
  const fileName = uriParts[uriParts.length - 1];

  // Create FormData for upload
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: fileName || 'photo.jpg',
  } as any);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'keepswell/mobile');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open('POST', uploadUrl);

    // Track upload progress
    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            progress: event.loaded / event.total,
          });
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch {
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Upload failed: Network error'));
    };

    xhr.send(formData);
  });
}

export async function uploadMultipleToCloudinary(
  uris: string[],
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const url = await uploadToCloudinary(uris[i], (progress) => {
      onProgress?.(i, progress);
    });
    urls.push(url);
  }

  return urls;
}
