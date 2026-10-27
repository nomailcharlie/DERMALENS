import {
  YOUCAM_MAX_FILE_BYTES,
  YOUCAM_MAX_LONG_SIDE,
  YOUCAM_SD_MIN_SHORT_SIDE,
  clamp,
} from './analysisConstants';

/**
 * Browser-side image preparation for the YouCam Skin Analysis API.
 *
 * The API requires: longest side ≤ 2560px, shortest side ≥ 480px (SD), file
 * ≤ 10MB. We convert WebP/PNG to JPEG and downscale oversized images without
 * upscaling small ones, and we never crop or distort the face.
 */

export interface PreparedImage {
  /** JPEG data URL ready to send to the edge function. */
  dataUrl: string;
  /** Decoded byte length of the JPEG blob. */
  size: number;
  /** Final width in pixels. */
  width: number;
  /** Final height in pixels. */
  height: number;
}

export class ImagePrepError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImagePrepError';
  }
}

/**
 * Load a File into an HTMLImageElement (via object URL).
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImagePrepError('That image could not be read. It may be corrupt.'));
    };
    img.src = url;
  });
}

/**
 * Load a data URL into an HTMLImageElement directly.
 */
function loadImageElementFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new ImagePrepError('That image could not be read. It may be corrupt.'));
    img.src = dataUrl;
  });
}

/**
 * Compute the target dimensions: downscale if the longest side exceeds the
 * limit, never upscale. Preserves aspect ratio.
 */
function targetDimensions(
  srcW: number,
  srcH: number,
): { width: number; height: number } {
  const longest = Math.max(srcW, srcH);
  if (longest <= YOUCAM_MAX_LONG_SIDE) {
    return { width: srcW, height: srcH };
  }
  const scale = YOUCAM_MAX_LONG_SIDE / longest;
  return {
    width: Math.round(srcW * scale),
    height: Math.round(srcH * scale),
  };
}

/**
 * Render the image to a canvas at the target size and export as JPEG.
 * Iterates quality down until under the byte limit.
 */
async function encodeJpeg(
  img: HTMLImageElement,
  width: number,
  height: number,
): Promise<{ dataUrl: string; size: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImagePrepError('Your browser could not process the image.');
  ctx.drawImage(img, 0, 0, width, height);

  let quality = 0.9;
  for (let i = 0; i < 6; i += 1) {
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const size = estimateDataUrlBytes(dataUrl);
    if (size <= YOUCAM_MAX_FILE_BYTES) {
      return { dataUrl, size };
    }
    quality = Math.max(0.4, quality - 0.1);
  }
  // Last resort: return the smallest we produced.
  const dataUrl = canvas.toDataURL('image/jpeg', 0.4);
  return { dataUrl, size: estimateDataUrlBytes(dataUrl) };
}

/** Approximate byte size of a base64 data URL payload. */
function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx < 0) return dataUrl.length;
  const base64 = dataUrl.slice(commaIdx + 1);
  return Math.floor((base64.length * 3) / 4);
}

/**
 * Prepare a user-selected File for the YouCam API:
 *  - decode
 *  - validate the short-side minimum
 *  - downscale if too large (no upscaling)
 *  - convert to JPEG
 *  - compress to stay under the 10MB API limit
 *
 * Throws `ImagePrepError` with a user-facing message on failure.
 */
export async function prepareImageForYouCam(file: File): Promise<PreparedImage> {
  const img = await loadImageElement(file);
  return prepareImageElement(img);
}

/**
 * Prepare an already-decoded image element (e.g. a cropped canvas output) for
 * the YouCam API. Same validation and encoding as `prepareImageForYouCam`.
 */
export async function prepareDataUrlForYouCam(dataUrl: string): Promise<PreparedImage> {
  const img = await loadImageElementFromDataUrl(dataUrl);
  return prepareImageElement(img);
}

async function prepareImageElement(img: HTMLImageElement): Promise<PreparedImage> {
  const { width: srcW, height: srcH } = img;
  if (srcW < 1 || srcH < 1) {
    throw new ImagePrepError('That image has no usable dimensions.');
  }
  const shortSide = Math.min(srcW, srcH);
  if (shortSide < YOUCAM_SD_MIN_SHORT_SIDE) {
    throw new ImagePrepError(
      `This image is ${shortSide}px on its short side. YouCam needs at least ${YOUCAM_SD_MIN_SHORT_SIDE}px. Please use a larger, clearer photo.`,
    );
  }
  const { width, height } = targetDimensions(srcW, srcH);
  const { dataUrl, size } = await encodeJpeg(img, width, height);
  return { dataUrl, size, width, height };
}

/** Human-readable range helper for trust copy. */
export function youcamLimitsSummary(): string {
  return `Longest side up to ${YOUCAM_MAX_LONG_SIDE}px, shortest side at least ${YOUCAM_SD_MIN_SHORT_SIDE}px`;
}

export { clamp };
