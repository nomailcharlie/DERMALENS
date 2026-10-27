import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Crop, X, ZoomIn } from 'lucide-react';
import { ImagePrepError, prepareDataUrlForYouCam } from '@/lib/imagePrep';
import type { PreparedImage } from '@/lib/imagePrep';
import { AnalysisSubmission } from '@/services/skinAnalysis';

interface CropModalProps {
  /** Data URL of the original image to crop. */
  imageUrl: string;
  /** Original file name (used for the submission). */
  fileName?: string;
  /** Called with the prepared submission from the cropped image. */
  onConfirm: (submission: AnalysisSubmission, previewUrl: string) => void;
  /** Called when the user cancels the crop. */
  onCancel: () => void;
}

const CROP_ASPECT = 3 / 4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export function CropModal({ imageUrl, fileName, onConfirm, onCancel }: CropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
      const containerW = containerRef.current?.clientWidth ?? 400;
      const fitScale = Math.min(containerW / img.naturalWidth, 1);
      setZoom(Math.max(MIN_ZOOM, fitScale));
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const clampOffset = useCallback(
    (ox: number, oy: number, z: number) => {
      const containerW = containerRef.current?.clientWidth ?? 400;
      const containerH = containerW / CROP_ASPECT;
      const displayedW = naturalSize.w * z;
      const displayedH = naturalSize.h * z;
      const maxX = Math.max(0, (displayedW - containerW) / 2);
      const maxY = Math.max(0, (displayedH - containerH) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [naturalSize],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset(clampOffset(dragStart.current.ox + dx, dragStart.current.oy + dy, zoom));
    },
    [dragging, zoom, clampOffset],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      setZoom(clamped);
      setOffset((prev) => clampOffset(prev.x, prev.y, clamped));
    },
    [clampOffset],
  );

  const exportCrop = useCallback(async (): Promise<{ dataUrl: string; width: number; height: number } | null> => {
    if (naturalSize.w === 0 || naturalSize.h === 0) return null;
    const containerW = containerRef.current?.clientWidth ?? 400;
    const containerH = containerW / CROP_ASPECT;
    const displayedW = naturalSize.w * zoom;
    const displayedH = naturalSize.h * zoom;
    const imgLeft = (containerW - displayedW) / 2 + offset.x;
    const imgTop = (containerH - displayedH) / 2 + offset.y;
    const cropScale = naturalSize.w / displayedW;

    const srcX = -imgLeft * cropScale;
    const srcY = -imgTop * cropScale;
    const srcW = containerW * cropScale;
    const srcH = containerH * cropScale;

    if (srcW < 1 || srcH < 1) return null;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(srcW);
    canvas.height = Math.round(srcH);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load image for export.'));
      img.src = imageUrl;
    });

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    return { dataUrl, width: canvas.width, height: canvas.height };
  }, [naturalSize, zoom, offset, imageUrl]);

  const handleConfirm = useCallback(async () => {
    setPreparing(true);
    setError(null);
    try {
      const cropResult = await exportCrop();
      if (!cropResult) {
        setError('Could not crop the image. Please try again.');
        setPreparing(false);
        return;
      }
      setPreviewUrl(cropResult.dataUrl);
      const prepared: PreparedImage = await prepareDataUrlForYouCam(cropResult.dataUrl);
      const sub: AnalysisSubmission = {
        dataUrl: prepared.dataUrl,
        fileName: fileName ?? 'cropped.jpg',
        mimeType: 'image/jpeg',
        size: prepared.size,
      };
      onConfirm(sub, prepared.dataUrl);
    } catch (e) {
      const message =
        e instanceof ImagePrepError
          ? e.message
          : 'Could not prepare the cropped image. The crop may be too small.';
      setError(message);
    } finally {
      setPreparing(false);
    }
  }, [exportCrop, fileName, onConfirm]);

  const containerW = containerRef.current?.clientWidth ?? 400;
  const containerH = containerW / CROP_ASPECT;
  const displayedW = naturalSize.w * zoom;
  const displayedH = naturalSize.h * zoom;
  const imgLeft = (containerW - displayedW) / 2 + offset.x;
  const imgTop = (containerH - displayedH) / 2 + offset.y;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/80 p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-ivory-200 bg-ivory-50 p-6 shadow-lift sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl">
            <Crop className="h-5 w-5 text-sage-700" /> Crop your photo
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close crop"
            className="rounded-full p-1.5 text-charcoal-500 transition-colors hover:bg-ivory-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-charcoal-600">
          Your face should fill most of the frame. Drag to position and use the
          slider to zoom. Keep your forehead, chin and both sides visible.
        </p>

        {/* Crop viewport — fixed 3:4 portrait aspect */}
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-2xl border-2 border-sage-500 bg-charcoal-900"
          style={{ aspectRatio: `${CROP_ASPECT}`, touchAction: 'none' }}
        >
          <img
            src={imageUrl}
            alt="Photo to crop"
            className="absolute select-none"
            style={{
              width: `${displayedW}px`,
              height: `${displayedH}px`,
              left: `${imgLeft}px`,
              top: `${imgTop}px`,
              cursor: dragging ? 'grabbing' : 'grab',
            }}
            draggable={false}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          {/* Rule-of-thirds guide lines */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/3 top-0 h-full w-px bg-ivory-50/20" />
            <div className="absolute left-2/3 top-0 h-full w-px bg-ivory-50/20" />
            <div className="absolute top-1/3 left-0 h-px w-full bg-ivory-50/20" />
            <div className="absolute top-2/3 left-0 h-px w-full bg-ivory-50/20" />
          </div>
        </div>

        {/* Zoom control */}
        <div className="mt-5 flex items-center gap-3">
          <ZoomIn className="h-4 w-4 shrink-0 text-charcoal-400" />
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            className="flex-1 accent-sage-600"
            aria-label="Zoom level"
          />
          <span className="w-10 text-right text-xs tabular-nums text-charcoal-500">
            {zoom.toFixed(1)}x
          </span>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-charcoal-400">
              Preview
            </p>
            <div className="flex items-center gap-4 rounded-2xl border border-ivory-200 bg-ivory-100 p-3">
              <img
                src={previewUrl}
                alt="Cropped preview"
                className="h-24 w-18 rounded-lg object-cover"
                style={{ aspectRatio: `${CROP_ASPECT}` }}
              />
              <p className="text-xs leading-relaxed text-charcoal-500">
                This cropped image will be sent for analysis. The face should
                fill most of the width.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-terracotta-500/30 bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={preparing}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-ivory-300 px-5 py-2.5 text-sm font-medium text-charcoal-700 transition-colors hover:bg-ivory-100 disabled:opacity-50"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={preparing || naturalSize.w === 0}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-2.5 text-sm font-semibold text-ivory-50 shadow-soft transition-colors hover:bg-sage-800 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {preparing ? 'Preparing…' : 'Use this crop'}
          </button>
        </div>
      </div>
    </div>
  );
}
