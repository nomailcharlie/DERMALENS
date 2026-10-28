import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ImageIcon, Layers, SplitSquareHorizontal, Eye } from 'lucide-react';
import type { SkinOverlay } from '@/types/analysis';

type ViewMode = 'original' | 'overlay' | 'split';

interface OverlayViewerProps {
  /** The exact prepared photo that was analyzed (data URL or object URL). */
  photoUrl: string | null;
  /** The currently selected YouCam mask overlay. */
  overlay: SkinOverlay | null;
  /** Whether the photo is from a saved demo (affects mask-link copy). */
  isDemo?: boolean;
}

/**
 * Photo-analysis viewer that shows the original analyzed photo with YouCam mask
 * overlays. Supports three view modes: Original, Overlay (blended), and
 * Side-by-side. Includes an opacity slider for the overlay blend.
 *
 * If a mask fails to load (expired signed URL, network error), the original
 * photo stays visible with a clear "temporarily unavailable" message — never
 * a blank or fabricated state.
 */
export function OverlayViewer({ photoUrl, overlay, isDemo }: OverlayViewerProps) {
  const [mode, setMode] = useState<ViewMode>(overlay ? 'overlay' : 'original');
  const [opacity, setOpacity] = useState(0.65);
  const [maskError, setMaskError] = useState(false);
  const [maskLoaded, setMaskLoaded] = useState(false);
  const [maskDims, setMaskDims] = useState<{ w: number; h: number } | null>(null);
  const [photoDims, setPhotoDims] = useState<{ w: number; h: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset mask state when switching overlays.
  useEffect(() => {
    setMaskError(false);
    setMaskLoaded(false);
    setMaskDims(null);
    if (overlay) {
      setMode('overlay');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay?.id]);

  const handlePhotoLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setPhotoDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  const handleMaskLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setMaskLoaded(true);
    setMaskError(false);
    setMaskDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  const handleMaskError = () => {
    setMaskError(true);
    setMaskLoaded(false);
  };

  // If mask dimensions differ significantly from the photo, fall back to
  // side-by-side rather than distorting either image.
  const dimsIncompatible =
    maskDims &&
    photoDims &&
    Math.abs(maskDims.w / maskDims.h - photoDims.w / photoDims.h) > 0.15;

  const effectiveMode = dimsIncompatible && mode === 'overlay' ? 'split' : mode;

  const showOpacityControl =
    effectiveMode === 'overlay' && maskLoaded && !dimsIncompatible;

  return (
    <div className="overflow-hidden rounded-3xl border border-ivory-200 bg-ivory-100 shadow-soft">
      {/* View mode selector */}
      <div className="flex items-center justify-between border-b border-ivory-200 bg-ivory-50/80 px-4 py-2.5">
        <div role="tablist" aria-label="View mode" className="flex gap-1.5">
          <ModeButton
            active={effectiveMode === 'original'}
            onClick={() => setMode('original')}
            icon={<ImageIcon className="h-3.5 w-3.5" />}
            label="Original"
          />
          <ModeButton
            active={effectiveMode === 'overlay'}
            onClick={() => setMode('overlay')}
            icon={<Layers className="h-3.5 w-3.5" />}
            label="Overlay"
            disabled={!overlay}
          />
          <ModeButton
            active={effectiveMode === 'split'}
            onClick={() => setMode('split')}
            icon={<SplitSquareHorizontal className="h-3.5 w-3.5" />}
            label="Side-by-side"
            disabled={!overlay}
          />
        </div>
        {overlay && (
          <span className="hidden text-[11px] font-medium text-charcoal-400 sm:inline">
            {overlay.label} mask
          </span>
        )}
      </div>

      {/* Viewer area */}
      <div ref={containerRef} className="relative bg-charcoal-900/5">
        {!photoUrl ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-charcoal-400">
            <ImageIcon className="h-8 w-8" />
            <p className="mt-3 text-sm">No photo available</p>
          </div>
        ) : effectiveMode === 'original' ? (
          <img
            src={photoUrl}
            alt="Your analyzed photo"
            className="mx-auto max-h-[420px] w-full object-contain"
            onLoad={handlePhotoLoad}
          />
        ) : effectiveMode === 'split' ? (
          <div className="grid grid-cols-2 gap-px bg-ivory-200">
            <div className="relative bg-ivory-100">
              <img
                src={photoUrl}
                alt="Original photo"
                className="mx-auto max-h-[420px] w-full object-contain"
                onLoad={handlePhotoLoad}
              />
              <span className="absolute left-2 top-2 rounded-full bg-charcoal-900/70 px-2.5 py-1 text-[10px] font-medium text-ivory-50">
                Original
              </span>
            </div>
            <div className="relative bg-ivory-100">
              {maskError ? (
                <MaskUnavailable photoUrl={photoUrl} />
              ) : overlay ? (
                <>
                  <img
                    src={overlay.imageUrl}
                    alt={`${overlay.label} mask overlay`}
                    className="mx-auto max-h-[420px] w-full object-contain"
                    onLoad={handleMaskLoad}
                    onError={handleMaskError}
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-sage-700/80 px-2.5 py-1 text-[10px] font-medium text-ivory-50">
                    {overlay.label} mask
                  </span>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          /* Overlay mode — stacked images with opacity blend */
          <div className="relative">
            <img
              src={photoUrl}
              alt="Your analyzed photo"
              className="mx-auto block max-h-[420px] w-full object-contain"
              onLoad={handlePhotoLoad}
            />
            {overlay && !maskError && (
              <img
                src={overlay.imageUrl}
                alt={`${overlay.label} mask overlay`}
                className="pointer-events-none absolute inset-0 mx-auto block max-h-[420px] w-full object-contain transition-opacity duration-200"
                style={{ opacity: maskLoaded ? opacity : 0 }}
                onLoad={handleMaskLoad}
                onError={handleMaskError}
              />
            )}
            {overlay && !maskLoaded && !maskError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="rounded-full bg-charcoal-900/60 px-4 py-2 text-xs text-ivory-50">
                  Loading mask…
                </span>
              </div>
            )}
            {maskError && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-terracotta-500/90 px-4 py-2 text-xs text-ivory-50">
                Mask temporarily unavailable
              </div>
            )}
          </div>
        )}
      </div>

      {/* Opacity slider + legend */}
      {showOpacityControl && (
        <div className="border-t border-ivory-200 bg-ivory-50/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-charcoal-500">Mask opacity</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(opacity * 100)}
              onChange={(e) => setOpacity(Number(e.target.value) / 100)}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-ivory-200 accent-sage-600"
              aria-label="Mask overlay opacity"
            />
            <span className="w-10 text-right text-[11px] tabular-nums text-charcoal-400">
              {Math.round(opacity * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Legend / explanation */}
      {overlay && (
        <div className="border-t border-ivory-200 bg-ivory-50/60 px-4 py-3">
          <div className="flex items-start gap-2">
            <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-600" />
            <div className="text-[11px] leading-relaxed text-charcoal-500">
              <p>
                <strong className="font-medium text-charcoal-700">{overlay.label}</strong>{' '}
                — this mask is a direct output from the YouCam skin-analysis model,
                highlighting detected areas for this concern.
              </p>
              {dimsIncompatible && (
                <p className="mt-1 text-charcoal-400">
                  The mask and photo have different aspect ratios, so they are shown
                  side-by-side rather than overlaid.
                </p>
              )}
              {!isDemo && (
                <p className="mt-1 text-charcoal-400">
                  Mask links from YouCam are valid for approximately 2 hours after analysis.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {dimsIncompatible && mode === 'overlay' && (
        <div className="flex items-center gap-2 border-t border-terracotta-500/20 bg-terracotta-500/5 px-4 py-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-terracotta-600" />
          <p className="text-[11px] text-charcoal-500">
            Showing side-by-side because the mask aspect ratio does not match the photo.
          </p>
        </div>
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? 'bg-sage-600 text-ivory-50'
          : disabled
            ? 'text-charcoal-300 cursor-not-allowed'
            : 'text-charcoal-600 hover:bg-ivory-200'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MaskUnavailable({ photoUrl }: { photoUrl: string }) {
  return (
    <div className="relative flex h-full min-h-[280px] flex-col items-center justify-center text-charcoal-400">
      <img
        src={photoUrl}
        alt="Original photo"
        className="mx-auto max-h-[420px] w-full object-contain opacity-40"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <AlertTriangle className="h-6 w-6 text-terracotta-500" />
        <p className="mt-2 text-xs text-charcoal-500">Mask temporarily unavailable</p>
        <p className="mt-0.5 text-[10px] text-charcoal-400">
          The original photo is still visible.
        </p>
      </div>
    </div>
  );
}
