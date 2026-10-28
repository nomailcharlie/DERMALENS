import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FOCUS_ESTIMATE_LABEL } from '../src/lib/recommendationEngine.ts';
import { PROVIDER_ERROR_MESSAGES } from '../src/lib/errorMessages.ts';

// ---------------------------------------------------------------------------
// Focus estimate label honesty
// ---------------------------------------------------------------------------

describe('focus estimate label honesty', () => {
  it('mentions "not a clinical severity score"', () => {
    assert.ok(FOCUS_ESTIMATE_LABEL.includes('not a clinical severity score'),
      `FOCUS_ESTIMATE_LABEL should mention "not a clinical severity score", got: ${FOCUS_ESTIMATE_LABEL}`);
  });

  it('mentions it is application-generated', () => {
    assert.ok(FOCUS_ESTIMATE_LABEL.includes('application-generated'),
      'FOCUS_ESTIMATE_LABEL should mention it is application-generated');
  });

  it('mentions "100 minus" or "100 −" formula', () => {
    assert.ok(
      FOCUS_ESTIMATE_LABEL.includes('100 minus') || FOCUS_ESTIMATE_LABEL.includes('100 −') || FOCUS_ESTIMATE_LABEL.includes('100-'),
      'FOCUS_ESTIMATE_LABEL should mention the 100 - raw_score formula',
    );
  });

  it('does not claim clinical authority', () => {
    assert.ok(
      !FOCUS_ESTIMATE_LABEL.includes('clinical score') || FOCUS_ESTIMATE_LABEL.includes('not a clinical'),
      'Should not present focus estimate as a clinical score without negation',
    );
  });

  it('does not predict treatment outcome', () => {
    const hasDisclaimer = FOCUS_ESTIMATE_LABEL.includes('prediction of treatment benefit') ||
      (!FOCUS_ESTIMATE_LABEL.includes('will work') && !FOCUS_ESTIMATE_LABEL.includes('may help'));
    assert.ok(hasDisclaimer,
      'Focus estimate label should not predict treatment benefit');
  });
});

// ---------------------------------------------------------------------------
// YouCam error code coverage
// ---------------------------------------------------------------------------

describe('YouCam error code coverage', () => {
  it('error_large_face_angle has a user-facing message', () => {
    assert.ok(
      'error_large_face_angle' in PROVIDER_ERROR_MESSAGES,
      'error_large_face_angle should have a user-facing message',
    );
  });

  it('all expected YouCam error codes have friendly messages', () => {
    const expectedCodes = [
      'error_src_face_too_small',
      'error_large_face_angle',
      'error_no_face',
      'error_multiple_faces',
      'error_src_image_invalid',
      'error_src_image_too_small',
    ];
    for (const code of expectedCodes) {
      assert.ok(code in PROVIDER_ERROR_MESSAGES,
        `${code} should have a user-facing message`);
      const msg = PROVIDER_ERROR_MESSAGES[code];
      assert.ok(msg.length > 20, `${code} message should be detailed (not terse)`);
    }
  });

  it('error_large_face_angle mentions straight-on photo', () => {
    const msg = PROVIDER_ERROR_MESSAGES['error_large_face_angle'];
    assert.ok(
      msg.toLowerCase().includes('straight') || msg.toLowerCase().includes('front-facing'),
      'error_large_face_angle should advise a straight-on photo',
    );
  });

  it('error_src_face_too_small mentions 60%', () => {
    const msg = PROVIDER_ERROR_MESSAGES['error_src_face_too_small'];
    assert.ok(msg.includes('60%'), 'face-too-small message should mention 60% threshold');
  });

  it('no error message contains raw API jargon or error codes', () => {
    for (const [code, msg] of Object.entries(PROVIDER_ERROR_MESSAGES)) {
      assert.ok(!msg.includes(code),
        `${code} message should not contain the raw error code`);
    }
  });
});
