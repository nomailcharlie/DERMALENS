import type {
  AnalysisError,
  AnalysisProgress,
  SkinAnalysisResult,
  SkinConcern,
  SkinOverlay,
  YouCamErrorCode,
  YouCamOutputEntry,
  YouCamTaskStatusResponse,
} from '@/types/analysis';
import {
  descriptionForConcernType,
  labelForConcernType,
} from '@/lib/analysisConstants';
import { PROVIDER_ERROR_MESSAGES } from '@/lib/errorMessages';

/**
 * Client-side service boundary for the DERMALENS skin-analysis flow.
 *
 * The browser never holds YouCam API credentials. All requests go to the
 * `analyze-skin` Supabase Edge Function, which proxies the YouCam API
 * server-side. This module handles:
 *  - calling the edge function,
 *  - resuming polling when the function returns `running`,
 *  - normalizing the raw YouCam result into the typed `SkinAnalysisResult`,
 *  - honoring an AbortSignal for cancellation.
 */

/** A photo prepared (resized/converted) and ready to send. */
export interface AnalysisSubmission {
  /** Base64 data URL of the prepared JPEG. */
  dataUrl: string;
  /** Original file name, if available. */
  fileName?: string;
  /** MIME type of the prepared image, e.g. 'image/jpeg'. */
  mimeType: string;
  /** Byte size of the prepared image. */
  size: number;
}

export type ProgressHandler = (progress: AnalysisProgress) => void;

interface EdgeSuccessBody {
  task_id: string;
  status: 'success';
  result: { output?: YouCamOutputEntry[] } | null;
}

interface EdgeRunningBody {
  task_id: string;
  status: 'running';
}

interface EdgeErrorBody {
  error: string;
  retryable: boolean;
  error_code?: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skin`;
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_RESUMPTIONS = 6;

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Run a skin analysis end-to-end.
 *
 * Calls the edge function, which registers the file, uploads it, creates the
 * YouCam task, and polls. If the function reaches its internal polling ceiling
 * while the task is still `running`, this client transparently resumes polling
 * by re-calling the function with the returned `task_id` (the function will not
 * create a duplicate task when a task_id is supplied).
 */
export async function analyzeSkin(
  submission: AnalysisSubmission,
  onProgress?: ProgressHandler,
  signal?: AbortSignal,
): Promise<SkinAnalysisResult> {
  const emit = (fraction: number, label: string) => {
    onProgress?.({ fraction, label });
  };

  emit(0.05, 'Preparing image');
  let taskId: string | null = null;

  for (let attempt = 0; attempt <= MAX_POLL_RESUMPTIONS; attempt += 1) {
    if (signal?.aborted) throw abortedError();

    const body: { image: string; taskId?: string } = { image: submission.dataUrl };
    if (taskId) {
      body.taskId = taskId;
      emit(clampFraction(0.6 + attempt * 0.05), 'Still analyzing — checking status');
    } else {
      emit(0.12, 'Uploading to secure analysis service');
    }

    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal,
    }).catch((e: unknown) => {
      if (e instanceof DOMException && e.name === 'AbortError') throw abortedError();
      throw analysisError('Could not reach the analysis service. Check your connection.', true);
    });

    if (!res.ok) {
      let errBody: EdgeErrorBody | null = null;
      try {
        errBody = (await res.json()) as EdgeErrorBody;
      } catch {
        // ignore parse failure
      }
      throw makeErrorFromResponse(
        errBody?.error ?? `The analysis service returned an error (${res.status}).`,
        errBody?.retryable ?? true,
        errBody?.error_code,
      );
    }

    const parsed = (await res.json()) as EdgeSuccessBody | EdgeRunningBody;

    if (parsed.status === 'success') {
      taskId = parsed.task_id;
      emit(0.95, 'Compiling results');
      return normalizeResult(taskId, parsed.result?.output);
    }

    // status === 'running' — pause then resume polling via the edge function.
    taskId = parsed.task_id;
    emit(0.55, 'Analyzing your skin');
    await sleep(POLL_INTERVAL_MS, signal);
  }

  // Exhausted resumptions; hand back a retryable timeout error but preserve
  // the task id via the error message so a retry can resume.
  throw analysisError(
    `Analysis is taking longer than expected. Task ${taskId} is still running on YouCam servers and can be checked again.`,
    true,
  );
}

/** Build the typed result from raw YouCam output entries. */
function normalizeResult(
  taskId: string,
  output: YouCamOutputEntry[] | undefined,
): SkinAnalysisResult {
  const concerns: SkinConcern[] = [];
  const overlays: SkinOverlay[] = [];
  const attributes: SkinAnalysisResult['attributes'] = {};

  if (output && output.length > 0) {
    for (const entry of output) {
      if (!entry.type) continue;

      // Non-concern entries: route into attributes, not the concern list.
      if (entry.type === 'all') {
        if (typeof entry.score === 'number') {
          attributes.overallScore = Math.round(entry.score);
        }
        continue;
      }
      if (entry.type === 'skin_age') {
        if (typeof entry.score === 'number') {
          attributes.estimatedSkinAge = Math.round(entry.score);
        }
        continue;
      }
      // `resize_image` is the resized source image, not a concern.
      if (entry.type === 'resize_image') continue;

      // Standard concern entries with ui_score / raw_score.
      const rawScore = typeof entry.raw_score === 'number' ? entry.raw_score : 0;
      const uiScore = typeof entry.ui_score === 'number' ? entry.ui_score : 0;
      const focusEstimate = Math.max(0, Math.min(100, Math.round(100 - rawScore)));
      concerns.push({
        id: entry.type,
        label: labelForConcernType(entry.type),
        description: descriptionForConcernType(entry.type),
        uiScore: Math.round(uiScore),
        rawScore,
        focusEstimate,
        maskUrls: Array.isArray(entry.mask_urls) ? entry.mask_urls : [],
      });
      if (Array.isArray(entry.mask_urls)) {
        entry.mask_urls.forEach((url, i) => {
          overlays.push({
            id: `${entry.type}-${i}`,
            label: labelForConcernType(entry.type),
            imageUrl: url,
          });
        });
      }
    }
  }

  return {
    concerns,
    overlays,
    attributes,
    taskId,
    generatedAt: Date.now(),
  };
}

function clampFraction(f: number): number {
  return Math.min(0.94, Math.max(0, f));
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortedError());
      return;
    }
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(abortedError());
      },
      { once: true },
    );
  });
}

function abortedError(): AnalysisError {
  return analysisError('Analysis cancelled.', false);
}

function analysisError(message: string, retryable: boolean): AnalysisError {
  return { message, retryable };
}

const KNOWN_ERROR_CODES = new Set(Object.keys(PROVIDER_ERROR_MESSAGES));

/** Map an upstream error code to a user-friendly message + structured error. */
function makeErrorFromResponse(
  rawMessage: string,
  retryable: boolean,
  errorCode?: string,
): AnalysisError {
  if (errorCode && KNOWN_ERROR_CODES.has(errorCode)) {
    return {
      message: PROVIDER_ERROR_MESSAGES[errorCode],
      retryable: false,
      errorCode: errorCode as YouCamErrorCode,
    };
  }
  return { message: rawMessage, retryable };
}

/** Type guard used in tests; exported for fixture-based verification. */
export function _normalizeResultForTest(
  taskId: string,
  output: YouCamOutputEntry[] | undefined,
): SkinAnalysisResult {
  return normalizeResult(taskId, output);
}

/** Re-exported for the polling-aware status type used by tests. */
export type { YouCamTaskStatusResponse };
