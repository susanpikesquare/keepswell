import { useCallback, useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Button } from '../ui';

/**
 * Interactive crop / zoom / reposition step for cover-image uploads.
 *
 * The cover is a 3:1 banner (templates are 1200×400), so we lock the crop
 * frame to 3:1 and export a 1200×400 JPEG. The user can:
 *   - drag the photo to recenter it within the frame
 *   - use the slider (or pinch / scroll) to zoom in/out (resize)
 *
 * On confirm we render the chosen crop area to a canvas and hand back a
 * Blob, which the caller uploads to Cloudinary.
 */

const OUTPUT_W = 1200;
const OUTPUT_H = 400;
const ASPECT = OUTPUT_W / OUTPUT_H; // 3:1

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Object URLs are same-origin; crossOrigin keeps canvas untainted if the
    // src ever becomes a remote URL.
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image'));
    img.src = src;
  });
}

/** Crop `imageSrc` to `cropPixels` and return a 1200×400 JPEG Blob. */
async function getCroppedBlob(imageSrc: string, cropPixels: Area): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_W;
  canvas.height = OUTPUT_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    OUTPUT_W,
    OUTPUT_H,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not export the image'))),
      'image/jpeg',
      0.9,
    );
  });
}

interface CoverCropModalProps {
  /** Object URL (or data URL) of the picked image. */
  imageSrc: string;
  /**
   * Called with the cropped 1200×400 JPEG blob when the user confirms.
   * MUST be awaited — it returns a promise that resolves when the upload
   * succeeds and rejects if it fails, so this modal can surface the error
   * in place and re-enable its buttons instead of getting stuck.
   */
  onConfirm: (blob: Blob) => Promise<void>;
  onCancel: () => void;
  /** True while the parent is uploading the confirmed crop. */
  busy?: boolean;
}

export function CoverCropModal({ imageSrc, onConfirm, onCancel, busy }: CoverCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = working || busy;

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setError(null);
    setWorking(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      // Awaited so an upload failure lands in our catch — otherwise the
      // modal would stay disabled forever with the error hidden behind it.
      await onConfirm(blob);
      // On success the parent unmounts this modal, so we don't reset state.
    } catch (e) {
      setError(
        (e as Error)?.message || 'Something went wrong saving the photo. Please try again.',
      );
      setWorking(false);
    }
  };

  // Escape should close ONLY the cropper, not the whole settings modal.
  // The parent Modal listens for Escape on document (bubble phase), so we
  // intercept in the capture phase and stop propagation before it reaches
  // the parent. We ignore Escape while an upload is in flight.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) onCancel();
    };
    document.addEventListener('keydown', onKeyDown, true); // capture
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [disabled, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Crop cover image"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#DCCCB7]/60">
          <h3 className="font-serif text-lg text-[#1F2328]">Position your cover photo</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Drag to reposition, and use the slider to zoom. Covers are shown as a wide banner.
          </p>
        </div>

        {/* Crop surface — fixed 3:1 frame */}
        <div className="relative w-full bg-[#1F2328]" style={{ aspectRatio: '3 / 1' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            restrictPosition
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom control */}
        <div className="px-5 pt-4">
          <label className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground w-12">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#D86F5C]"
              aria-label="Zoom"
              disabled={disabled}
            />
          </label>
          {error ? <p className="text-sm text-red-600 mt-2">{error}</p> : null}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={disabled}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={disabled || !croppedAreaPixels}>
            {disabled ? 'Saving…' : 'Use this photo'}
          </Button>
        </div>
      </div>
    </div>
  );
}
