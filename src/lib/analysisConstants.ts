/**
 * Image constraints and the SD (standard-definition) skin-concern catalog for
 * the YouCam Skin Analysis API.
 *
 * SD concerns are the only set we request in Phase 2 (we never mix SD and HD).
 * See https://docs.perfectcorp.com/reference/ai_skin_analysis.
 */

/** Browser-accepted upload formats (the user-facing limit). */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** User-facing max upload size. */
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024; // 12 MB

/** YouCam API image constraints (we prepare images to satisfy these). */
export const YOUCAM_MAX_LONG_SIDE = 2560;
export const YOUCAM_SD_MIN_SHORT_SIDE = 480;
export const YOUCAM_MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/** SD skin concerns requested from the YouCam API. */
export const SD_ACTIONS = ['wrinkle', 'pore', 'texture', 'acne'] as const;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Clamp a value into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Catalog of the SD skin concerns we request, with friendly labels and
 * descriptions. Keys match the `type` field returned by the YouCam API.
 */
export const SD_CONCERN_CATALOG: Record<
  string,
  { label: string; description: string }
> = {
  acne: {
    label: 'Acne & blemishes',
    description:
      'Visible blemishes, breakouts and congestion detected across the face.',
  },
  wrinkle: {
    label: 'Wrinkles',
    description: 'Fine lines and deeper wrinkles associated with skin aging.',
  },
  pore: {
    label: 'Pores',
    description: 'Visible or enlarged pore size across the T-zone and cheeks.',
  },
  texture: {
    label: 'Skin texture',
    description: 'Surface roughness and unevenness of the skin.',
  },
};

/** Catalog of every YouCam concern type we may receive, for friendly labels. */
export const ALL_CONCERN_LABELS: Record<string, { label: string; description: string }> = {
  ...SD_CONCERN_CATALOG,
  age_spot: { label: 'Age spots', description: 'Age spots and pigmentation.' },
  dark_circle_v2: { label: 'Dark circles', description: 'Shadowing under the eyes.' },
  eye_bag: { label: 'Eye bags', description: 'Puffiness beneath the lower eyelid.' },
  droopy_upper_eyelid: { label: 'Upper eyelid droop', description: 'Upper eyelid drooping.' },
  droopy_lower_eyelid: { label: 'Lower eyelid droop', description: 'Lower eyelid drooping.' },
  firmness: { label: 'Firmness', description: 'Skin firmness and elasticity.' },
  moisture: { label: 'Moisture', description: 'Skin hydration levels.' },
  radiance: { label: 'Radiance', description: 'Skin brightness and radiance.' },
  redness: { label: 'Redness', description: 'Skin redness and inflammation.' },
  oiliness: { label: 'Oiliness', description: 'Excess sebum production.' },
  tear_trough: { label: 'Tear trough', description: 'Tear trough depressions.' },
  skin_type: { label: 'Skin type', description: 'Detected skin type.' },
};

/** Friendly label for a YouCam concern `type`, falling back to a cleaned form. */
export function labelForConcernType(type: string): string {
  const entry = ALL_CONCERN_LABELS[type];
  if (entry) return entry.label;
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function descriptionForConcernType(type: string): string {
  const entry = ALL_CONCERN_LABELS[type];
  if (entry) return entry.description;
  return 'A skin attribute measured by the YouCam skin-analysis model.';
}
