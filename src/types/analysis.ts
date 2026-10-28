/**
 * Type definitions for the DERMALENS skin-analysis flow.
 *
 * Grounded in the official Perfect Corp YouCam Skin Analysis API reference
 * (https://docs.perfectcorp.com/reference/ai_skin_analysis). The API returns
 * `ui_score` and `raw_score` where a HIGHER score indicates HEALTHIER, more
 * aesthetically favorable skin — not severity. These types preserve that
 * direction so the UI never misrepresents a high reading as a problem.
 */

/** Lifecycle stages for the analysis flow. */
export type AnalysisStatus = 'idle' | 'analyzing' | 'succeeded' | 'failed';

/** Status the YouCam task endpoint reports while polling. */
export type YouCamTaskStatus = 'running' | 'success' | 'error';

/** A single measured skin concern returned by the YouCam API. */
export interface SkinConcern {
  /** Stable concern type from the API, e.g. 'acne', 'wrinkle'. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Short explanatory copy describing the concern. */
  description: string;
  /** YouCam UI score (1–100, integer). Higher = healthier. */
  uiScore: number;
  /** YouCam raw score (1–100, float). Higher = healthier. */
  rawScore: number;
  /**
   * DERMALENS application estimate of how much this concern is worth focusing
   * on, derived as `100 - rawScore` (so a low health score = high focus).
   * Labelled as a DERMALENS estimate, never a YouCam severity score.
   */
  focusEstimate: number;
  /** Optional mask image URLs returned by the API for this concern. */
  maskUrls: string[];
}

/** Visual overlay the API can provide over the submitted photo. */
export interface SkinOverlay {
  id: string;
  label: string;
  /** Remote URL of the annotated/mask image. */
  imageUrl: string;
}

/** Overall attributes the API may surface about the face. */
export interface SkinAttributes {
  /** Overall skin-condition score (1–100). Higher = healthier. */
  overallScore?: number;
  /** AI-derived skin age relative to the population distribution. */
  estimatedSkinAge?: number;
  /** Detected skin type label, if the API provides it. */
  skinType?: string;
}

/** The complete result of a successful skin analysis. */
export interface SkinAnalysisResult {
  concerns: SkinConcern[];
  overlays: SkinOverlay[];
  attributes: SkinAttributes;
  /** YouCam task id (valid for 30 days; useful for re-fetching results). */
  taskId: string;
  /** Timestamp (ms) the result was produced locally. */
  generatedAt: number;
}

/** Progress event emitted while an analysis runs. */
export interface AnalysisProgress {
  /** 0–1 fraction completed. */
  fraction: number;
  /** Human-readable stage label. */
  label: string;
}

/** Known YouCam provider error codes that the UI maps to tailored guidance. */
export type YouCamErrorCode =
  | 'error_src_face_too_small'
  | 'error_large_face_angle'
  | 'error_no_face'
  | 'error_multiple_faces'
  | 'error_src_image_invalid'
  | 'error_src_image_too_small';

/** Error returned when an analysis fails. */
export interface AnalysisError {
  message: string;
  /** Whether retrying is likely to help (network error vs. unsupported image). */
  retryable: boolean;
  /** YouCam provider error code if the upstream returned a recognizable one. */
  errorCode?: YouCamErrorCode;
}

/* ----------------------- Phase 3 recommendation types --------------------- */

/** User-selectable personal goals (max two at a time). */
export type UserGoal =
  | 'breakout_prone'
  | 'pores'
  | 'texture'
  | 'fine_lines'
  | 'simpler_routine';

/** Routine intensity preference. */
export type RoutineIntensity = 'essential' | 'balanced' | 'targeted';

/** Skin sensitivity self-report. */
export type SensitivityLevel = 'none' | 'sensitive' | 'unsure';

/** A user's routine + shopping preferences. */
export interface UserPreferences {
  goals: UserGoal[];
  intensity: RoutineIntensity;
  sensitivity: SensitivityLevel;
  /** Maximum spend in USD, if the user provided one. */
  budgetUsd?: number;
}

/** Routine step categories. */
export type RoutineCategory =
  | 'cleanse'
  | 'moisturize'
  | 'protect'
  | 'treat';

/** A single step in a generated routine. */
export interface RoutineStep {
  id: string;
  part: 'morning' | 'evening';
  order: number;
  category: RoutineCategory;
  label: string;
  purpose: string;
  productCharacteristics: string;
  applicationNote: string;
  precautions: string[];
  optional: boolean;
  /** Why this step is included, referencing goals/concerns. */
  rationale: string;
  /** IDs of products in the catalog that may suit this step. */
  matchedProductIds: string[];
}

/** A reason a product matched the user's needs. */
export interface ProductMatchReason {
  /** What drove the match: a goal, a concern, a preference, or a category. */
  source: 'goal' | 'concern' | 'preference' | 'category';
  /** The specific goal/concern/preference id. */
  sourceId: string;
  /** Human-readable explanation. */
  explanation: string;
}

/** A product matched to the user's routine, with explanations. */
export interface ProductMatch {
  productId: string;
  reasons: ProductMatchReason[];
  /** True if budget filtering confirmed price within the user's budget. */
  withinBudget: boolean | null;
  /** True if price/market is unknown — cannot confirm affordability. */
  priceUnknown: boolean;
}

/* ----------------------------- Raw API shapes ----------------------------- */
/* Used inside the edge function + normalization layer. Not imported by UI.   */

/** Raw YouCam File API response body. */
export interface YouCamFileResponse {
  status: number;
  data?: {
    files?: {
      content_type: string;
      file_name: string;
      file_id: string;
      requests: {
        method: string;
        url: string;
        headers: Record<string, string>;
      }[];
    }[];
  };
  error?: string;
  error_code?: string;
}

/** Raw YouCam task-creation response body. */
export interface YouCamTaskResponse {
  status: number;
  data?: { task_id: string };
  error?: string;
  error_code?: string;
}

/** A single entry in the task result `output` array. */
export interface YouCamOutputEntry {
  type: string;
  /** Health score (1–100) for concern types. Higher = healthier. */
  ui_score?: number;
  /** Raw health score (1–100) for concern types. Higher = healthier. */
  raw_score?: number;
  /** Single score used by non-concern entries like `all` and `skin_age`. */
  score?: number;
  /** Mask/overlay image URLs for this entry. */
  mask_urls?: string[];
  /** Optional result image URL (present on some non-concern entries). */
  url?: string | null;
}

/** Raw YouCam task-status (polling) response body. */
export interface YouCamTaskStatusResponse {
  status: number;
  data?: {
    task_status: YouCamTaskStatus;
    results?: {
      output?: YouCamOutputEntry[];
    };
  };
  error?: string;
  error_code?: string;
}
