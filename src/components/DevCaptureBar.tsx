import { useState } from 'react';
import { AlertTriangle, Camera, Download } from 'lucide-react';
import type { SkinAnalysisResult } from '@/types/analysis';

interface DevCaptureBarProps {
  result: SkinAnalysisResult;
  /** The prepared photo data URL that was actually submitted to YouCam. */
  previewUrl: string | null;
}

/**
 * Developer-only capture bar shown after a genuine successful analysis in
 * development mode. Lets the developer download the exact prepared photo,
 * normalized results JSON, and mask files to create a demo fixture.
 *
 * This component is NEVER shown in production builds and NEVER initiates a
 * new analysis. It only downloads artifacts from an analysis that already ran.
 *
 * The developer must manually place the downloaded files into public/demo/
 * and commit them. A warning is shown that committing makes the photo public.
 */
export function DevCaptureBar({ result, previewUrl }: DevCaptureBarProps) {
  const [expanded, setExpanded] = useState(false);

  const isDev = import.meta.env.DEV;

  if (!isDev) return null;

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadDataUrl = (filename: string, dataUrl: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const handleCaptureAll = () => {
    // Download the prepared portrait.
    if (previewUrl) {
      downloadDataUrl('portrait.jpg', previewUrl);
    }

    // Build the fixture JSON with local mask paths.
    const fixtureJson = {
      provenance:
        'Saved demo fixture from a genuine YouCam skin analysis. Captured by the developer capture workflow.',
      concerns: result.concerns.map((c) => ({
        ...c,
        // Clear remote mask URLs — the fixture uses local paths only.
        maskUrls: [],
      })),
      overlays: result.overlays.map((o) => ({
        id: o.id,
        label: o.label,
        imagePath: `masks/${o.id}.png`,
      })),
      attributes: result.attributes,
      taskId: result.taskId,
      generatedAt: result.generatedAt,
    };

    downloadJson('analysis.json', fixtureJson);

    // Download each mask.
    result.overlays.forEach((o) => {
      fetch(o.imageUrl)
        .then((r) => r.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${o.id}.png`;
          a.click();
          URL.revokeObjectURL(url);
        })
        .catch(() => {
          // Mask URLs may have expired — skip silently.
        });
    });
  };

  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-700">
          <Camera className="h-3.5 w-3.5" /> Dev: Capture Demo Fixture
        </p>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-amber-700 underline"
        >
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <p className="text-xs leading-relaxed text-charcoal-600">
            Download the prepared portrait, normalized results JSON, and all
            available mask files. Place them in <code className="rounded bg-amber-100 px-1">public/demo/</code> with the
            portrait as <code className="rounded bg-amber-100 px-1">portrait.jpg</code>, masks in <code className="rounded bg-amber-100 px-1">masks/</code>, and the JSON as <code className="rounded bg-amber-100 px-1">analysis.json</code>.
          </p>

          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-100/50 p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
            <p className="text-[11px] leading-relaxed text-amber-800">
              <strong>Warning:</strong> Adding a portrait to the public repository
              will make the photo publicly accessible. Use a rights-cleared or
              fictional portrait, not your personal photograph.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCaptureAll}
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Download className="h-3.5 w-3.5" /> Download all fixture files
          </button>

          <p className="text-[10px] text-charcoal-400">
            Mask URLs from YouCam are valid for ~2 hours. Download promptly after
            analysis. This does not initiate a new analysis.
          </p>
        </div>
      )}
    </div>
  );
}
