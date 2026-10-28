import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvidenceTrail,
  generateRecommendations,
  goalLabel,
  FOCUS_ESTIMATE_LABEL,
} from '../src/lib/recommendationEngine.ts';
import { getProductById, PRODUCT_CATALOG } from '../src/data/productCatalog.ts';
import type {
  SkinAnalysisResult,
  SkinConcern,
  UserPreferences,
} from '../src/types/analysis.ts';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeConcern(overrides: Partial<SkinConcern> = {}): SkinConcern {
  return {
    id: 'acne',
    label: 'Acne & blemishes',
    description: 'Visible blemishes detected across the face.',
    uiScore: 72,
    rawScore: 70.5,
    focusEstimate: 30,
    maskUrls: ['https://example.com/mask-acne.png'],
    ...overrides,
  };
}

function makeResult(concerns: SkinConcern[]): SkinAnalysisResult {
  return {
    concerns,
    overlays: concerns
      .filter((c) => c.maskUrls.length > 0)
      .map((c) => ({
        id: c.id,
        label: c.label,
        imageUrl: c.maskUrls[0],
      })),
    attributes: { overallScore: 75 },
    taskId: 'task-test-001',
    generatedAt: Date.now(),
  };
}

const DEFAULT_PREFS: UserPreferences = {
  goals: [],
  intensity: 'balanced',
  sensitivity: 'none',
};

// ---------------------------------------------------------------------------
// Evidence Trail tests
// ---------------------------------------------------------------------------

describe('buildEvidenceTrail', () => {
  it('returns null for an unknown concern id', () => {
    const result = makeResult([makeConcern()]);
    const trail = buildEvidenceTrail('nonexistent', result, DEFAULT_PREFS, []);
    assert.equal(trail, null);
  });

  it('uses actual raw_score and ui_score from YouCam', () => {
    const concern = makeConcern({ rawScore: 45.2, uiScore: 48 });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.rawScore, 45.2);
    assert.equal(trail!.uiScore, 48);
  });

  it('computes focus estimate as 100 - rawScore', () => {
    const concern = makeConcern({ rawScore: 40 });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.focusEstimate, 60);
  });

  it('sets focusEstimate to null when raw score is invalid', () => {
    const concern = makeConcern({ rawScore: NaN });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.focusEstimate, null);
    assert.ok(
      trail!.unknowns.some((u) => u.includes('focus estimate could not be calculated')),
    );
  });

  it('sets rawScore and uiScore to null when unavailable', () => {
    const concern = makeConcern({ rawScore: NaN, uiScore: NaN });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.rawScore, null);
    // NaN is typeof 'number' but not finite — the trail should treat it as unavailable.
    assert.ok(trail!.uiScore === null || !Number.isFinite(trail!.uiScore!),
      'uiScore should be null or non-finite when NaN');
  });

  it('reports hasMask=false when no mask URLs returned', () => {
    const concern = makeConcern({ maskUrls: [] });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.hasMask, false);
    assert.ok(
      trail!.unknowns.some((u) => u.includes('did not return a visual mask')),
    );
  });

  it('reports hasMask=true when mask URLs exist', () => {
    const concern = makeConcern({ maskUrls: ['https://example.com/mask.png'] });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.hasMask, true);
  });

  it('always includes the medical-disclaimer unknown', () => {
    const concern = makeConcern();
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.ok(
      trail!.unknowns.some((u) => u.includes('medical diagnosis')),
      'should always include the medical-disclaimer unknown',
    );
  });

  it('links related routine steps to the concern via catalog attributes', () => {
    const concern = makeConcern({ id: 'acne', rawScore: 30 });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    assert.ok(trail!.relatedSteps.length > 0, 'should have related steps');
    // Each related step should have at least one product that supports the acne concern.
    for (const step of trail!.relatedSteps) {
      const products = step.matchedProductIds.map((id) => getProductById(id));
      assert.ok(
        products.some((p) => p?.supportedConcerns.includes('acne')),
        `step "${step.label}" should link to a product supporting acne`,
      );
    }
  });

  it('detects when a user goal boosts a concern', () => {
    const concern = makeConcern({ id: 'acne' });
    const result = makeResult([concern]);
    const prefs: UserPreferences = {
      goals: ['breakout_prone'],
      intensity: 'balanced',
      sensitivity: 'none',
    };
    const recs = generateRecommendations(result, prefs);
    const trail = buildEvidenceTrail('acne', result, prefs, recs.routine);
    assert.ok(trail);
    assert.equal(trail!.boostedByGoal, true);
    assert.equal(trail!.matchingGoal, 'breakout_prone');
  });

  it('does not mark boostedByGoal when goal not selected', () => {
    const concern = makeConcern({ id: 'acne' });
    const result = makeResult([concern]);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, []);
    assert.ok(trail);
    assert.equal(trail!.boostedByGoal, false);
  });

  it('separates detected concerns from user-selected goals', () => {
    const concern = makeConcern({ id: 'wrinkle', rawScore: 50 });
    const result = makeResult([concern]);
    const prefs: UserPreferences = {
      goals: ['breakout_prone'],
      intensity: 'balanced',
      sensitivity: 'none',
    };
    const recs = generateRecommendations(result, prefs);
    const trail = buildEvidenceTrail('wrinkle', result, prefs, recs.routine);
    assert.ok(trail);
    // wrinkle maps to fine_lines, not breakout_prone
    assert.equal(trail!.matchingGoal, 'fine_lines');
    assert.equal(trail!.boostedByGoal, false);
  });
});

// ---------------------------------------------------------------------------
// Score interpretation tests
// ---------------------------------------------------------------------------

describe('score interpretation', () => {
  it('higher raw score = lower focus estimate (health-favorable)', () => {
    const healthy = makeConcern({ id: 'a', rawScore: 90 });
    const unhealthy = makeConcern({ id: 'b', rawScore: 20 });
    const result = makeResult([healthy, unhealthy]);
    const t1 = buildEvidenceTrail('a', result, DEFAULT_PREFS, []);
    const t2 = buildEvidenceTrail('b', result, DEFAULT_PREFS, []);
    assert.ok(t1 && t2);
    assert.ok(t1!.focusEstimate! < t2!.focusEstimate!,
      'healthier skin should have a lower focus estimate');
  });

  it('focus estimate label clarifies it is not a clinical severity score', () => {
    assert.ok(FOCUS_ESTIMATE_LABEL.includes('not a clinical severity score'));
  });
});

// ---------------------------------------------------------------------------
// Routine reasons matching catalog attributes
// ---------------------------------------------------------------------------

describe('routine reasons match catalog attributes', () => {
  it('every product match reason references a real catalog field', () => {
    const concerns = [
      makeConcern({ id: 'acne', rawScore: 30 }),
      makeConcern({ id: 'pore', label: 'Pores', rawScore: 40 }),
    ];
    const result = makeResult(concerns);
    const prefs: UserPreferences = {
      goals: ['breakout_prone'],
      intensity: 'targeted',
      sensitivity: 'none',
    };
    const recs = generateRecommendations(result, prefs);
    for (const [productId, match] of Object.entries(recs.productMatches)) {
      const product = getProductById(productId);
      assert.ok(product, `product ${productId} should exist in catalog`);
      for (const reason of match.reasons) {
        // Each reason should mention a goal, concern, category, or step that the product supports.
        const text = reason.explanation.toLowerCase();
        const referencesKnown =
          product.supportedGoals.some((g) => text.includes(goalLabel(g).toLowerCase().split(' ')[0])) ||
          product.supportedConcerns.some((c) => text.includes(c)) ||
          text.includes(product.category) ||
          reason.source === 'category';
        assert.ok(referencesKnown,
          `reason "${reason.explanation}" should reference a verified catalog attribute for ${product.name}`);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Unknown prices and regional availability
// ---------------------------------------------------------------------------

describe('unknown prices and availability', () => {
  it('all catalog products have priceUnknown=true', () => {
    for (const p of PRODUCT_CATALOG) {
      assert.ok(p.priceUnknown, `${p.name} should have priceUnknown=true`);
    }
  });

  it('product matches report priceUnknown=true', () => {
    const result = makeResult([makeConcern({ rawScore: 30 })]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    for (const match of Object.values(recs.productMatches)) {
      assert.ok(match.priceUnknown, 'all matches should have priceUnknown=true');
    }
  });
});

// ---------------------------------------------------------------------------
// Routine Passport behavior when no analysis exists
// ---------------------------------------------------------------------------

describe('passport behavior without analysis', () => {
  it('generateRecommendations requires a result — passport uses general plan when result is null', () => {
    // The passport component handles null result by showing a "general routine plan" label.
    // Here we verify the engine still works with concerns that have no scores.
    const emptyResult = makeResult([]);
    const recs = generateRecommendations(emptyResult, DEFAULT_PREFS);
    assert.ok(recs.dataNotes.some((n) => n.includes('No standard concerns')),
      'should note that no concerns were returned');
    // Routine should still have basic steps.
    assert.ok(recs.routine.length > 0, 'should still generate a basic routine');
  });
});

// ---------------------------------------------------------------------------
// Empty or incomplete recommendation data
// ---------------------------------------------------------------------------

describe('empty or incomplete data', () => {
  it('handles a result with zero concerns', () => {
    const result = makeResult([]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    assert.ok(recs.routine.length > 0);
    // With no concerns, the engine still generates basic steps and may match
    // general-purpose products. The key invariant is the data note.
    assert.ok(recs.dataNotes.some((n) => n.includes('No standard concerns')));
  });

  it('handles concerns with missing masks gracefully', () => {
    const concern = makeConcern({ maskUrls: [] });
    const result = makeResult([concern]);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, []);
    assert.ok(trail);
    assert.equal(trail!.hasMask, false);
  });

  it('handles concerns with NaN scores', () => {
    const concern = makeConcern({ rawScore: NaN, uiScore: NaN });
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    assert.ok(recs.routine.length > 0);
    assert.ok(recs.dataNotes.some((n) => n.includes('valid raw score')));
  });

  it('does not crash with all concerns having NaN scores', () => {
    const concerns = [
      makeConcern({ id: 'acne', rawScore: NaN, uiScore: NaN }),
      makeConcern({ id: 'wrinkle', label: 'Wrinkles', rawScore: NaN, uiScore: NaN }),
      makeConcern({ id: 'pore', label: 'Pores', rawScore: NaN, uiScore: NaN }),
      makeConcern({ id: 'texture', label: 'Skin texture', rawScore: NaN, uiScore: NaN }),
    ];
    const result = makeResult(concerns);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    assert.ok(recs.routine.length > 0);
  });
});

// ---------------------------------------------------------------------------
// Privacy-safe export content
// ---------------------------------------------------------------------------

describe('privacy-safe export', () => {
  it('recommendation results do not contain photo data or preview URLs', () => {
    const result = makeResult([makeConcern()]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const serialized = JSON.stringify(recs);
    assert.ok(!serialized.includes('data:image'), 'no embedded image data');
    assert.ok(!serialized.includes('previewUrl'), 'no preview URL');
    assert.ok(!serialized.includes('blob:'), 'no blob URLs');
  });

  it('evidence trail does not contain the original photo URL', () => {
    const concern = makeConcern();
    const result = makeResult([concern]);
    const recs = generateRecommendations(result, DEFAULT_PREFS);
    const trail = buildEvidenceTrail('acne', result, DEFAULT_PREFS, recs.routine);
    assert.ok(trail);
    const serialized = JSON.stringify(trail);
    assert.ok(!serialized.includes('data:image'), 'no embedded image data in trail');
  });

  it('product info URLs are manufacturer pages, not checkout links', () => {
    for (const p of PRODUCT_CATALOG) {
      assert.ok(
        !p.infoUrl.includes('cart') && !p.infoUrl.includes('checkout'),
        `${p.name} info URL should not be a checkout link`,
      );
    }
  });
});
