import { useState } from 'react';
import { AlertTriangle, Camera, CheckCircle2, Download, XCircle } from 'lucide-react';
import type { SkinAnalysisResult } from '@/types/analysis';

interface DevCaptureBarProps {
  result: SkinAnalysisResult;
  /** The prepared photo data URL that was actually submitted to YouCam. */
  previewUrl: string | null;
}

interface CaptureReport {
  portraitSaved: boolean;
  analysisJsonSaved: boolean;
  masksTotal: number;
  masksSaved: number;
  maskFailures: Array<{ id: string; label: string; reason: string }>;
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
  const [report, setReport] = useState<CaptureReport | null>(null);
  const [capturing, setCapturing] = useState(false);

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

  const handleCaptureAll = async () => {
    setCapturing(true);
    setReport(null);

    // 1. Download the prepared portrait.
    let portraitSaved = false;
    if (previewUrl) {
      try {
        downloadDataUrl('portrait.jpg', previewUrl);
        portraitSaved = true;
      } catch {
        portraitSaved = false;
      }
    }

    // 2. Build the fixture JSON with local mask paths.
    //    Preserve the original mask URLs in a separate field for traceability,
    //    but the fixture's overlays use local paths so it works offline.
    //    We do NOT include any API keys, signed URLs, or credentials.
    const fixtureJson = {
      provenance:
        'Saved demo fixture from a genuine YouCam skin analysis. Captured by the developer capture workflow.',
      capturedAt: new Date().toISOString(),
      concerns: result.concerns.map((c) => ({
        id: c.id,
        label: c.label,
        description: c.description,
        uiScore: c.uiScore,
        rawScore: c.rawScore,
        focusEstimate: c.focusEstimate,
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

    let analysisJsonSaved = false;
    try {
      downloadJson('analysis.json', fixtureJson);
      analysisJsonSaved = true;
    } catch {
      analysisJsonSaved = false;
    }

    // 3. Download each mask. Track success/failure individually.
    const maskFailures: Array<{ id: string; label: string; reason: string }> = [];
    let masksSaved = 0;

    const maskPromises = result.overlays.map(async (o) => {
      try {
        const res = await fetch(o.imageUrl);
        if (!res.ok) {
          maskFailures.push({
            id: o.id,
            label: o.label,
            reason: `HTTP ${res.status} — the signed URL may have expired`,
          });
          return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${o.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        masksSaved += 1;
      } catch (e) {
        maskFailures.push({
          id: o.id,
          label: o.label,
          reason: e instanceof Error ? e.message : 'Fetch failed — URL may have expired',
        });
      }
    });

    await Promise.all(maskPromises);

    setReport({
      portraitSaved,
      analysisJsonSaved,
      masksTotal: result.overlays.length,
      masksSaved,
      maskFailures,
    });
    setCapturing(false);
  };

  const allOk = report && report.portraitSaved && report.analysisJsonSaved && report.masksSaved === report.masksTotal;
  const hasFailures = report && report.maskFailures.length > 0;
  const incomplete = report && (!report.portraitSaved || !report.analysisJsonSaved || report.masksSaved < report.masksTotal);

  return (
    <div className="mt-4 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
      {/* Always-visible capture button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Capture Demo Fixture — Developer Only
            </p>
            <p className="text-[11px] text-amber-700/80">
              Saves the portrait, normalized results, and all real masks from this analysis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCaptureAll}
          disabled={capturing}
          className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          {capturing ? 'Capturing…' : 'Download all fixture files'}
        </button>
      </div>

      {/* Capture report */}
      {report && (
        <div className="mt-4 space-y-2 border-t border-amber-300 pt-3">
          {/* Summary line */}
          <div className="flex items-center gap-2">
            {allOk ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium text-green-800">
                  All {report.masksTotal + 2} files downloaded. Place them in{' '}
                  <code className="rounded bg-amber-100 px-1">public/demo/</code> —
                  portrait as <code className="rounded bg-amber-100 px-1">portrait.jpg</code>,
                  JSON as <code className="rounded bg-amber-100 px-1">analysis.json</code>,
                  masks in <code className="rounded bg-amber-100 px-1">masks/</code>.
                </p>
              </>
            ) : incomplete ? (
              <>
                <XCircle className="h-4 w-4 text-red-600" />
                <p className="text-xs font-medium text-red-800">
                  Fixture is incomplete — see details below. The demo button will not
                  appear until all files are placed correctly.
                </p>
              </>
            ) : null}
          </div>

          {/* Itemized results */}
          <ul className="space-y-1 text-xs text-charcoal-700">
            <li className="flex items-center gap-2">
              {report.portraitSaved ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              )}
              Portrait (portrait.jpg){report.portraitSaved ? ' — downloaded' : ' — FAILED: no preview URL available'}
            </li>
            <li className="flex items-center gap-2">
              {report.analysisJsonSaved ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              )}
              Analysis JSON (analysis.json){report.analysisJsonSaved ? ' — downloaded' : ' — FAILED'}
            </li>
            <li className="flex items-center gap-2">
              {report.masksSaved === report.masksTotal ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              )}
              Masks — {report.masksSaved} of {report.masksTotal} downloaded
            </li>
          </ul>

          {/* Mask failure details */}
          {hasFailures && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3">
              <p className="text-xs font-semibold text-red-800">Mask download failures:</p>
              <ul className="mt-1 space-y-1">
                {report.maskFailures.map((f) => (
                  <li key={f.id} className="text-[11px] text-red-700">
                    <code className="rounded bg-red-100 px-1">{f.id}.png</code> ({f.label}): {f.reason}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-red-700">
                YouCam mask URLs expire ~2 hours after analysis. If masks failed, re-run a
                live analysis and capture again promptly.
              </p>
            </div>
          )}

          {/* Privacy warning */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-100/50 p-3">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
            <p className="text-[11px] leading-relaxed text-amber-800">
              <strong>Warning:</strong> Adding a portrait to the public repository will make
              the photo publicly accessible. Use a rights-cleared or fictional portrait, not
              your personal photograph. The downloaded JSON contains no API keys, signed URLs,
              or credentials — only normalized scores and local mask paths.
            </p>
          </div>
        </div>
      )}

      {!report && (
        <p className="mt-2 text-[10px] text-charcoal-400">
          Mask URLs from YouCam expire ~2 hours after analysis. Download promptly. This does
          not initiate a new analysis.
        </p>
      )}
    </div>
  );
}
