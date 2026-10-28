/**
 * YouCam provider error messages, kept separate from the service layer so they
 * can be imported in Node test environments without triggering browser-only
 * dependencies (import.meta.env, fetch, etc.).
 */

/**
 * User-friendly messages for known YouCam error codes. Each message explains
 * the problem in plain language and gives actionable guidance.
 */
export const PROVIDER_ERROR_MESSAGES: Record<string, string> = {
  error_src_face_too_small:
    'Your face appears too small in this photo. The face should occupy more than 60% of the image width for accurate skin analysis.',
  error_large_face_angle:
    'Your face is turned too far away from the camera. Please choose a straight-on photograph with your eyes level and your nose centered.',
  error_no_face:
    'No face was detected in this photo. Please use a clear, front-facing photo with your face centered and visible.',
  error_multiple_faces:
    'Multiple faces were detected. Please use a photo with only one face, centered and filling most of the frame.',
  error_src_image_invalid:
    'The image could not be processed. Please try a different photo in JPEG, PNG, or WebP format.',
  error_src_image_too_small:
    'The image resolution is too low for analysis. Please use a larger photo where the shortest side is at least 480 pixels.',
};
