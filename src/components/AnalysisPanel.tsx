import { AlertTriangle, Crop, Lightbulb, RotateCw, X } from 'lucide-react';
import type { AnalysisError, AnalysisProgress } from '@/types/analysis';
import { TrustNotice } from './TrustNotice';

interface AnalysisPanelProps {
  progress: AnalysisProgress | null;
  error: AnalysisError | null;
  previewUrl: string | null;
  onRetry: () => void;
  onCancel: () => void;
  onCrop?: () => void;
}

/** Loading + progress + failure states for the analysis flow. */
export function AnalysisPanel({
  progress,
  error,
  previewUrl,
  onRetry,
  onCancel,
  onCrop,
}: AnalysisPanelProps) {
  if (error) {
    const isFaceTooSmall = error.errorCode === 'error_src_face_too_small';
    const isFaceAngle = error.errorCode === 'error_large_face_angle';
    const isPhotoError =
      isFaceTooSmall ||
      isFaceAngle ||
      error.errorCode === 'error_no_face' ||
      error.errorCode === 'error_multiple_faces';

    return (
      <section className="animate-fade-in pt-28 sm:pt-32">
        <div className="container-page">
          <div className="mx-auto max-w-xl rounded-3xl border border-terracotta-500/25 bg-ivory-50 p-8 text-center shadow-soft sm:p-10">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-500/10 text-terracotta-600">
              <AlertTriangle className="h-7 w-7" strokeWidth={1.5} />
            </span>
            <h2 className="mt-5 text-2xl">We couldn&apos;t complete the analysis</h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal-600">
              {error.message}
            </p>

            {/* Tailored photo tips per error type */}
            {isFaceTooSmall && (
              <PhotoTips
                title="How to fix this"
                tips={[
                  'Move closer so your face fills more than 60% of the image width.',
                  'Keep your forehead, chin and both sides of your face visible.',
                  'Use bright, even lighting facing you.',
                ]}
              />
            )}

            {isFaceAngle && (
              <PhotoTips
                title="How to fix this"
                tips={[
                  'Choose a straight-on photograph with your eyes level.',
                  'Make sure your nose is centered and facing the camera directly.',
                  'Avoid photos taken from the side or at an angle — cropping cannot correct a turned face.',
                ]}
              />
            )}

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isFaceTooSmall && onCrop && (
                <button
                  type="button"
                  onClick={onCrop}
                  className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-sage-800"
                >
                  <Crop className="h-4 w-4" /> Crop photo
                </button>
              )}
              {isFaceTooSmall && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center gap-2 rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-charcoal-700 transition-colors hover:bg-ivory-100"
                >
                  Choose a closer photo
                </button>
              )}
              {!isFaceTooSmall && !isPhotoError && error.retryable && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-6 py-3 text-sm font-medium text-ivory-50 transition-colors hover:bg-charcoal-800"
                >
                  <RotateCw className="h-4 w-4" /> Try again
                </button>
              )}
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-full border border-ivory-300 px-6 py-3 text-sm font-medium text-charcoal-700 transition-colors hover:bg-ivory-100"
              >
                <X className="h-4 w-4" />
                {isPhotoError ? 'Choose a different photo' : 'Use a different photo'}
              </button>
            </div>

            {error.errorCode && (
              <p className="mt-5 text-[10px] uppercase tracking-wider text-charcoal-300">
                Ref: {error.errorCode}
              </p>
            )}

            <div className="mt-6 text-left">
              <TrustNotice variant="card" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  const fraction = progress?.fraction ?? 0;

  return (
    <section className="animate-fade-in pt-28 sm:pt-32">
      <div className="container-page">
        <div className="mx-auto max-w-xl text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-sage-200/60 animate-pulse-ring" />
            <span className="absolute inset-2 rounded-full bg-sage-100" />
            {previewUrl ? (
              <img
                src={previewUrl}
                alt=""
                className="relative h-20 w-20 rounded-full object-cover ring-4 ring-ivory-50"
              />
            ) : (
              <span className="relative h-20 w-20 rounded-full bg-sage-200" />
            )}
          </div>

          <h2 className="mt-7 text-2xl sm:text-3xl">Reading your skin</h2>
          <p className="mt-2 text-sm text-charcoal-500">
            This usually takes about a minute. Please keep this tab open.
          </p>

          <div className="mt-8">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ivory-200">
              <div
                className="h-full rounded-full bg-sage-600 transition-all duration-700 ease-out"
                style={{ width: `${Math.round(fraction * 100)}%` }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-charcoal-400">
              <span>{progress?.label ?? 'Starting'}</span>
              <span className="tabular-nums">{Math.round(fraction * 100)}%</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-ivory-300 px-5 py-2.5 text-sm font-medium text-charcoal-600 transition-colors hover:bg-ivory-100"
          >
            <X className="h-4 w-4" /> Cancel
          </button>
        </div>
      </div>
    </section>
  );
}

function PhotoTips({ title, tips }: { title: string; tips: string[] }) {
  return (
    <div className="mt-5 rounded-2xl border border-sage-200 bg-sage-50 p-4 text-left">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-sage-700">
        <Lightbulb className="h-3.5 w-3.5" /> {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-charcoal-600">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-sage-500" />
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
