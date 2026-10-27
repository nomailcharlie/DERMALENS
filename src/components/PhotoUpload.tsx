import { useCallback, useId, useRef, useState } from 'react';
import {
  Camera,
  ImageUp,
  RefreshCw,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  formatBytes,
} from '@/lib/analysisConstants';

interface PhotoUploadProps {
  /** Current preview data URL, or null when no image is selected. */
  previewUrl: string | null;
  /** Called with a validation error message (cleared when a new file is picked). */
  onFileSelected: (file: File | null, error: string | null) => void;
  onClear: () => void;
}

const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');

export function PhotoUpload({
  previewUrl,
  onFileSelected,
  onClear,
}: PhotoUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const validate = useCallback((file: File): string | null => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      return 'Please choose a JPEG, PNG or WebP image.';
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return `That image is ${formatBytes(file.size)}. The limit is ${formatBytes(
        MAX_IMAGE_BYTES,
      )}.`;
    }
    return null;
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const error = validate(file);
      onFileSelected(error ? null : file, error);
    },
    [onFileSelected, validate],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  if (previewUrl) {
    return (
      <div className="animate-scale-in">
        <div className="relative overflow-hidden rounded-3xl border border-ivory-300 bg-ivory-100 shadow-soft">
          <img
            src={previewUrl}
            alt="Your selected photo for analysis"
            className="mx-auto max-h-[460px] w-full object-contain"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal-900/55 to-transparent p-4 pt-12">
            <p className="text-sm font-medium text-ivory-50">
              Photo ready for analysis
            </p>
          </div>
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-ivory-50/95 px-3 py-2 text-xs font-medium text-charcoal-800 shadow-soft transition-colors hover:bg-ivory-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={onClear}
              className="flex items-center gap-1.5 rounded-full bg-ivory-50/95 px-3 py-2 text-xs font-medium text-charcoal-800 shadow-soft transition-colors hover:bg-ivory-50"
              aria-label="Remove photo"
            >
              <Trash2 className="h-3.5 w-3.5" /> Remove
            </button>
          </div>
        </div>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300 sm:py-20 ${
          dragOver
            ? 'border-sage-500 bg-sage-50 scale-[1.01]'
            : 'border-ivory-300 bg-ivory-100/60 hover:border-sage-400 hover:bg-ivory-100'
        }`}
      >
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
            dragOver
              ? 'bg-sage-600 text-ivory-50'
              : 'bg-ivory-50 text-sage-600 group-hover:bg-sage-100'
          }`}
        >
          <ImageUp className="h-7 w-7" strokeWidth={1.5} />
        </span>
        <p className="mt-5 font-serif text-xl text-charcoal-900">
          Drag & drop your photo here
        </p>
        <p className="mt-1.5 text-sm text-charcoal-500">
          or <span className="font-medium text-sage-700 underline-offset-2 group-hover:underline">browse from your device</span>
        </p>
        <p className="mt-5 flex items-center gap-1.5 text-xs text-charcoal-400">
          <Camera className="h-3.5 w-3.5" /> JPEG, PNG or WebP · up to {formatBytes(MAX_IMAGE_BYTES)}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      <div className="mt-4 rounded-2xl border border-sage-200 bg-sage-50/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-sage-700">
          Photo tips for best results
        </p>
        <ul className="mt-2.5 grid gap-x-4 gap-y-1.5 text-xs leading-relaxed text-charcoal-600 sm:grid-cols-2">
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            Use a close-up, front-facing photo
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            Face should fill more than 60% of the image width
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            Keep your entire face visible and centered
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            Use bright, even lighting facing you
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            Avoid filters, sunglasses and strong shadows
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            A full-size portrait may still be unsuitable
          </li>
        </ul>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-charcoal-400">
        <ShieldCheck className="h-3.5 w-3.5 text-sage-500" />
        DERMALENS does not store your photo. It is sent to the YouCam API for
        processing and removed by the provider within 30 days.
      </p>
    </div>
  );
}

/** Compact inline error banner tied to upload validation. */
export function UploadError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="mt-3 flex items-start justify-between gap-3 rounded-2xl border border-terracotta-500/30 bg-terracotta-500/10 px-4 py-3 text-sm text-terracotta-600"
    >
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 hover:bg-terracotta-500/15"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
