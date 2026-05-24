/**
 * Browser-native Cloudinary upload helper for the Keepswell web app.
 *
 * Mirrors the API of mobile/lib/cloudinary.ts so the two apps speak the
 * same language. Uses the unauth ed upload preset flow (no API secret in
 * the browser) — the preset is configured to allow uploads to the
 * `keepswell/web` folder.
 *
 * Required Vite env vars (set in both frontend/.env and Render):
 *   VITE_CLOUDINARY_CLOUD_NAME     e.g. "keepswell-prod"
 *   VITE_CLOUDINARY_UPLOAD_PRESET  e.g. "keepswell_web"  (unsigned)
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export interface UploadProgress {
  loaded: number;
  total: number;
  progress: number; // 0..1
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/** True if upload is wired up. UI can hide the button when this is false. */
export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Upload a single File (from an <input type="file"> change event) and
 * resolve with the resulting `secure_url`. Calls `onProgress` while the
 * bytes upload — handy for showing a progress bar on big photos.
 */
export async function uploadFileToCloudinary(
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary not configured. Set VITE_CLOUDINARY_CLOUD_NAME and ' +
        'VITE_CLOUDINARY_UPLOAD_PRESET in the frontend environment.',
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'keepswell/web');

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  // XHR (not fetch) because fetch can't report upload progress.
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

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
          const data = JSON.parse(xhr.responseText) as CloudinaryUploadResponse;
          resolve(data.secure_url);
        } catch (e) {
          reject(new Error('Cloudinary returned malformed JSON: ' + xhr.responseText));
        }
      } else {
        reject(new Error(`Cloudinary upload failed (${xhr.status}): ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Cloudinary upload'));

    xhr.send(formData);
  });
}
