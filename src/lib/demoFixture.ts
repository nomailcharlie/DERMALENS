/**
 * Demo fixture support for DERMALENS.
 *
 * A demo fixture is a saved, complete YouCam analysis bundle stored locally in
 * the public/ directory. It allows judges to explore the full app experience
 * without consuming API units.
 *
 * Fixture structure:
 *   public/demo/analysis.json  — normalized SkinAnalysisResult with local mask paths
 *   public/demo/portrait.jpg   — the exact photo that was analyzed
 *   public/demo/masks/*.png    — actual mask files downloaded from the analysis
 *
 * The fixture is checked at runtime. If any required piece is missing or is a
 * placeholder, the demo button is not shown — no fake content is generated.
 */

import type { SkinAnalysisResult, SkinOverlay } from '@/types/analysis';

export interface DemoFixture {
  result: SkinAnalysisResult;
  portraitUrl: string;
  isDemo: true;
}

interface DemoAnalysisJson {
  concerns: SkinAnalysisResult['concerns'];
  overlays: Array<{
    id: string;
    label: string;
    /** Local path to the mask file, e.g. "masks/acne.png". */
    imagePath: string;
  }>;
  attributes: SkinAnalysisResult['attributes'];
  taskId: string;
  generatedAt: number;
  provenance: string;
  /** Present only in the placeholder template. */
  _status?: string;
}

const DEMO_BASE = '/demo';
const DEMO_PORTRAIT = `${DEMO_BASE}/portrait.jpg`;
const DEMO_ANALYSIS = `${DEMO_BASE}/analysis.json`;

let cachedFixture: DemoFixture | null = null;
let availabilityChecked = false;
let isAvailable = false;

/**
 * Check whether a complete, valid demo fixture exists. Fetches the analysis.json
 * and verifies it is not the placeholder template, then checks the portrait
 * image exists. Caches the result so repeated checks don't re-fetch.
 */
export async function checkDemoAvailability(): Promise<boolean> {
  if (availabilityChecked) return isAvailable;
  availabilityChecked = true;

  try {
    const res = await fetch(DEMO_ANALYSIS);
    if (!res.ok) {
      isAvailable = false;
      return false;
    }
    const json = await res.json();

    // Reject the placeholder template.
    if (json._status === 'placeholder' || !json.concerns || json.concerns.length === 0) {
      isAvailable = false;
      return false;
    }

    // Check the portrait image exists.
    const portraitRes = await fetch(DEMO_PORTRAIT, { method: 'HEAD' });
    if (!portraitRes.ok) {
      isAvailable = false;
      return false;
    }

    // A fixture is unavailable until every referenced local mask exists.
    if (!Array.isArray(json.overlays) || json.overlays.length === 0) {
      isAvailable = false;
      return false;
    }
    const maskChecks = await Promise.all(
      json.overlays.map((overlay: { imagePath: string }) =>
        fetch(`${DEMO_BASE}/${overlay.imagePath}`, { method: 'HEAD' }),
      ),
    );
    if (maskChecks.some((mask) => !mask.ok)) {
      isAvailable = false;
      return false;
    }

    isAvailable = true;
  } catch {
    isAvailable = false;
  }
  return isAvailable;
}

/** Synchronous check — returns the cached availability result. */
export function isDemoAvailable(): boolean {
  return isAvailable;
}

/**
 * Load the complete demo fixture. Throws if the fixture is incomplete or
 * malformed — never returns partial or fabricated data.
 */
export async function loadDemoFixture(): Promise<DemoFixture> {
  if (cachedFixture) return cachedFixture;

  const [analysisRes, portraitRes] = await Promise.all([
    fetch(DEMO_ANALYSIS),
    fetch(DEMO_PORTRAIT, { method: 'HEAD' }),
  ]);

  if (!analysisRes.ok) {
    throw new Error('Demo analysis data is not available.');
  }
  if (!portraitRes.ok) {
    throw new Error('Demo portrait image is not available.');
  }

  const json = (await analysisRes.json()) as DemoAnalysisJson;

  if (json._status === 'placeholder' || !json.concerns || !Array.isArray(json.concerns) || json.concerns.length === 0) {
    throw new Error('Demo fixture has not been captured yet. No real data is available.');
  }
  if (!json.overlays || !Array.isArray(json.overlays) || json.overlays.length === 0) {
    throw new Error('Demo analysis data is malformed — missing overlays.');
  }

  const maskChecks = await Promise.all(
    json.overlays.map((overlay) =>
      fetch(`${DEMO_BASE}/${overlay.imagePath}`, { method: 'HEAD' }),
    ),
  );
  if (maskChecks.some((mask) => !mask.ok)) {
    throw new Error('Demo fixture is incomplete — one or more mask files are missing.');
  }

  // Convert local mask paths to full URLs.
  const overlays: SkinOverlay[] = json.overlays.map((o) => ({
    id: o.id,
    label: o.label,
    imageUrl: o.imagePath.startsWith('http')
      ? o.imagePath
      : `${DEMO_BASE}/${o.imagePath}`,
  }));

  const result: SkinAnalysisResult = {
    concerns: json.concerns,
    overlays,
    attributes: json.attributes ?? {},
    taskId: json.taskId ?? 'demo-task',
    generatedAt: json.generatedAt ?? Date.now(),
  };

  cachedFixture = {
    result,
    portraitUrl: DEMO_PORTRAIT,
    isDemo: true,
  };

  return cachedFixture;
}

/**
 * Reset the demo cache. Used when switching back to live mode to ensure
 * no demo data leaks into a live session.
 */
export function resetDemoCache(): void {
  cachedFixture = null;
}
