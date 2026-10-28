/**
 * Deterministic recommendation engine for DERMALENS.
 *
 * Takes normalized YouCam analysis results + user preferences and produces:
 * 1. A prioritized concern list (raw_score-based, user goals can override)
 * 2. A morning + evening routine with explainable rationale
 * 3. A curated product shortlist with transparent match reasons
 *
 * Rules:
 * - Uses raw_score (health-favorable, higher = healthier) for prioritization.
 * - Uses focusEstimate = 100 - raw_score (clamped 0–100) only when raw_score
 *   is a valid finite number. Never invents scores.
 * - Never ranks by ui_score as severity — it is more favorably calibrated.
 * - Deterministic: same inputs always produce the same output.
 * - No random ordering, no LLM calls, no fabricated evidence.
 */

import type {
  ProductMatch,
  ProductMatchReason,
  RoutineCategory,
  RoutineStep,
  SkinAnalysisResult,
  SkinConcern,
  UserGoal,
  UserPreferences,
} from '@/types/analysis';
import {
  PRODUCT_CATALOG,
  type ProductCatalogEntry,
} from '@/data/productCatalog';
import { labelForConcernType } from './analysisConstants';

const GOAL_LABELS: Record<UserGoal, string> = {
  breakout_prone: 'Breakout-prone appearance',
  pores: 'Appearance of pores',
  texture: 'Skin texture',
  fine_lines: 'Fine-line appearance',
  simpler_routine: 'A simpler everyday routine',
};

const GOAL_TO_CONCERN: Record<UserGoal, string | null> = {
  breakout_prone: 'acne',
  pores: 'pore',
  texture: 'texture',
  fine_lines: 'wrinkle',
  simpler_routine: null,
};

export function goalLabel(goal: UserGoal): string {
  return GOAL_LABELS[goal];
}

/** Clamp to 0–100. */
function clampScore(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

/** Compute a safe focus estimate only when raw_score is valid. */
function safeFocusEstimate(concern: SkinConcern): number | null {
  if (typeof concern.rawScore !== 'number' || !Number.isFinite(concern.rawScore)) {
    return null;
  }
  return clampScore(100 - concern.rawScore);
}

export interface PrioritizedConcern {
  concernId: string;
  label: string;
  rawScore: number;
  focusEstimate: number | null;
  /** True when this concern was boosted by a user-selected goal. */
  boostedByGoal: boolean;
  /** True when the user selected a matching goal (not a detected concern). */
  isGoalSelected: boolean;
}

/**
 * Rank concerns by focus estimate (highest first). User-selected goals are
 * always surfaced to the top so the user can override the automatic order.
 * Goals without a matching detected concern are still listed (as goal-only).
 */
export function prioritizeConcerns(
  result: SkinAnalysisResult,
  preferences: UserPreferences,
): PrioritizedConcern[] {
  const goalConcernIds = new Set(
    preferences.goals
      .map((g) => GOAL_TO_CONCERN[g])
      .filter((id): id is string => id !== null),
  );

  const detected = result.concerns.map((c) => {
    const focus = safeFocusEstimate(c);
    const boosted = goalConcernIds.has(c.id);
    return {
      concernId: c.id,
      label: c.label,
      rawScore: c.rawScore,
      focusEstimate: focus,
      boostedByGoal: boosted,
      isGoalSelected: false,
    };
  });

  // Sort detected concerns: boosted ones first, then by focus estimate desc.
  detected.sort((a, b) => {
    if (a.boostedByGoal !== b.boostedByGoal) return a.boostedByGoal ? -1 : 1;
    const fa = a.focusEstimate ?? -1;
    const fb = b.focusEstimate ?? -1;
    return fb - fa;
  });

  // Add goal-only entries (user selected a goal with no matching detected concern).
  const detectedIds = new Set(detected.map((d) => d.concernId));
  const goalOnly: PrioritizedConcern[] = [];
  for (const goal of preferences.goals) {
    const concernId = GOAL_TO_CONCERN[goal];
    if (concernId && !detectedIds.has(concernId)) {
      goalOnly.push({
        concernId,
        label: labelForConcernType(concernId),
        rawScore: NaN,
        focusEstimate: null,
        boostedByGoal: true,
        isGoalSelected: true,
      });
    }
  }

  // Goal-only entries go to the very top (user explicitly chose them).
  return [...goalOnly, ...detected];
}

/* ----------------------------- Routine builder ---------------------------- */

/**
 * Build a morning + evening routine based on the prioritized concerns and
 * user preferences. Sensitive skin suppresses optional targeted actives.
 */
export function buildRoutine(
  result: SkinAnalysisResult,
  preferences: UserPreferences,
): RoutineStep[] {
  const prioritized = prioritizeConcerns(result, preferences);
  const topConcernId = prioritized[0]?.concernId ?? null;

  const includeTargetedStep =
    preferences.intensity === 'targeted' &&
    preferences.sensitivity !== 'sensitive' &&
    preferences.sensitivity !== 'unsure' &&
    topConcernId !== null;

  const morning: RoutineStep[] = [];
  const evening: RoutineStep[] = [];

  // Morning steps
  morning.push({
    id: 'am-cleanse',
    part: 'morning',
    order: 1,
    category: 'cleanse',
    label: 'Gentle cleanser',
    purpose: 'Remove overnight oil and prepare skin for the day.',
    productCharacteristics:
      'A gentle, non-stripping cleanser suited to your skin type.',
    applicationNote: 'Massage onto damp skin, rinse with lukewarm water.',
    precautions: ['Avoid hot water, which can strip the skin barrier.'],
    optional: preferences.goals.includes('simpler_routine'),
    rationale: 'A foundational step for every routine, regardless of concerns.',
    matchedProductIds: matchProductsForCategory('cleanse', preferences, result),
  });

  // Morning moisturizer — optional for oily/breakout-prone, included for others
  const skipAmMoisturizer =
    preferences.goals.includes('simpler_routine') ||
    preferences.goals.includes('breakout_prone');
  if (!skipAmMoisturizer) {
    morning.push({
      id: 'am-moisturize',
      part: 'morning',
      order: 2,
      category: 'moisturize',
      label: 'Moisturizer',
      purpose: 'Support the skin barrier and hydration through the day.',
      productCharacteristics: 'A lightweight, non-comedogenic moisturizer.',
      applicationNote: 'Apply a thin layer to face and neck.',
      precautions: [],
      optional: false,
      rationale: 'Hydration supports overall skin comfort and barrier function.',
      matchedProductIds: matchProductsForCategory('moisturize', preferences, result),
    });
  }

  morning.push({
    id: 'am-protect',
    part: 'morning',
    order: skipAmMoisturizer ? 2 : 3,
    category: 'protect',
    label: 'Broad-spectrum SPF 30+',
    purpose: 'Protect against UV exposure, which contributes to visible aging and skin damage.',
    productCharacteristics:
      'Broad-spectrum SPF 30 or higher, suited to your skin type.',
    applicationNote: 'Apply as the final morning step. Reapply every two hours during sun exposure.',
    precautions: [
      'Sun protection is the single most evidence-supported step for long-term skin appearance.',
    ],
    optional: false,
    rationale:
      topConcernId === 'wrinkle'
        ? 'Sun protection is the top priority for fine-line appearance.'
        : 'Sun protection is foundational for all skin types and concerns.',
    matchedProductIds: matchProductsForCategory('protect', preferences, result),
  });

  // Evening steps
  evening.push({
    id: 'pm-cleanse',
    part: 'evening',
    order: 1,
    category: 'cleanse',
    label: 'Gentle cleanser',
    purpose: 'Remove sunscreen, sebum, and the day’s accumulation.',
    productCharacteristics: 'The same gentle cleanser used in the morning.',
    applicationNote: 'Cleanse thoroughly but gently.',
    precautions: [],
    optional: false,
    rationale: 'Evening cleansing is essential to remove sunscreen and debris.',
    matchedProductIds: matchProductsForCategory('cleanse', preferences, result),
  });

  // Optional targeted step (evening only, at most one)
  if (includeTargetedStep) {
    const targetedProductIds = matchProductsForCategory('treat', preferences, result, topConcernId);
    const hasSalicylicTarget = targetedProductIds.length > 0;
    evening.push({
      id: 'pm-treat',
      part: 'evening',
      order: 2,
      category: 'treat',
      label: 'Optional targeted step',
      purpose: 'An optional, carefully explained cosmetic active for your top concern.',
      productCharacteristics:
        topConcernId === 'acne' || topConcernId === 'pore'
          ? 'An optional BHA (salicylic acid) exfoliant, used per manufacturer directions.'
          : 'An optional gentle active suited to your top measured concern.',
      applicationNote: 'Apply a small amount to clean, dry skin. Start with 1–2 times per week.',
      precautions: [
        'Patch test before use. Avoid on sensitive, peeling, or compromised skin.',
        'Use sun protection during the day.',
        'This is a cosmetic product, not a medical treatment.',
        'Do not combine multiple new actives at once.',
      ],
      optional: true,
      rationale: hasSalicylicTarget
        ? `Optional step matched to your top concern: ${labelForConcernType(topConcernId)}.`
        : 'No verified targeted product is available for your top concern.',
      matchedProductIds: targetedProductIds,
    });
  }

  evening.push({
    id: 'pm-moisturize',
    part: 'evening',
    order: includeTargetedStep ? 3 : 2,
    category: 'moisturize',
    label: 'Moisturizer',
    purpose: 'Support overnight skin barrier repair and hydration.',
    productCharacteristics: 'A moisturizer suited to your skin type.',
    applicationNote: 'Apply as the final evening step.',
    precautions: [],
    optional: false,
    rationale: 'Overnight moisturization supports the skin barrier.',
    matchedProductIds: matchProductsForCategory('moisturize', preferences, result),
  });

  return [...morning, ...evening];
}

/* --------------------------- Product matching ----------------------------- */

/**
 * Match products for a given routine category, filtered by preferences and
 * supported concerns/goals. Returns catalog IDs ordered by relevance.
 */
function matchProductsForCategory(
  category: ProductCatalogEntry['category'],
  preferences: UserPreferences,
  result: SkinAnalysisResult,
  topConcernId?: string | null,
): string[] {
  const detectedConcernIds = new Set(result.concerns.map((c) => c.id));
  const goalSet = new Set(preferences.goals);

  const matches = PRODUCT_CATALOG.filter((p) => {
    if (p.category !== category) return false;

    // Sensitive skin: suppress non-sensitive-suitable products.
    if (
      (preferences.sensitivity === 'sensitive' ||
        preferences.sensitivity === 'unsure') &&
      !p.suitableForSensitive &&
      category === 'treat'
    ) {
      return false;
    }

    // Match if the product supports a selected goal OR a detected concern.
    const supportsGoal = p.supportedGoals.some((g) => goalSet.has(g));
    const supportsConcern = p.supportedConcerns.some((c) => detectedConcernIds.has(c));
    const isCategoryMatch =
      category === 'cleanse' || category === 'moisturize' || category === 'protect';

    // For treat category, require explicit goal or concern match.
    if (category === 'treat') {
      return supportsGoal || (topConcernId ? p.supportedConcerns.includes(topConcernId) : false);
    }

    // For foundational categories, include if it supports the goal/concern OR
    // is a general fit (all cleansers/moisturizers/SPF are eligible, but we
    // prioritize those matching goals/concerns).
    return supportsGoal || supportsConcern || isCategoryMatch;
  });

  // Sort: products matching a selected goal first, then by catalog order.
  matches.sort((a, b) => {
    const aGoal = a.supportedGoals.some((g) => goalSet.has(g)) ? 0 : 1;
    const bGoal = b.supportedGoals.some((g) => goalSet.has(g)) ? 0 : 1;
    return aGoal - bGoal;
  });

  return matches.map((p) => p.id);
}

/**
 * Build detailed product match objects with explainable reasons for each
 * matched product in a routine step.
 */
export function buildProductMatches(
  step: RoutineStep,
  preferences: UserPreferences,
  result: SkinAnalysisResult,
): ProductMatch[] {
  const detectedConcernIds = new Set(result.concerns.map((c) => c.id));
  const goalSet = new Set(preferences.goals);

  return step.matchedProductIds.map((productId) => {
    const product = PRODUCT_CATALOG.find((p) => p.id === productId);
    if (!product) {
      return { productId, reasons: [], withinBudget: null, priceUnknown: true };
    }

    const reasons: ProductMatchReason[] = [];

    // Goal-based reasons
    for (const goal of product.supportedGoals) {
      if (goalSet.has(goal)) {
        reasons.push({
          source: 'goal',
          sourceId: goal,
          explanation: `You selected the goal “${GOAL_LABELS[goal]},” which this product is positioned to support.`,
        });
      }
    }

    // Concern-based reasons
    for (const concernId of product.supportedConcerns) {
      if (detectedConcernIds.has(concernId)) {
        reasons.push({
          source: 'concern',
          sourceId: concernId,
          explanation: `Your YouCam analysis measured “${labelForConcernType(concernId)},” which this product relates to cosmetically.`,
        });
      }
    }

    // Category reason (always include one so the match is explained)
    reasons.push({
      source: 'category',
      sourceId: product.category,
      explanation: `Fits the “${step.label}” step in your ${step.part === 'morning' ? 'morning' : 'evening'} routine.`,
    });

    // Sensitivity preference reason
    if (
      (preferences.sensitivity === 'sensitive' || preferences.sensitivity === 'unsure') &&
      product.suitableForSensitive
    ) {
      reasons.push({
        source: 'preference',
        sourceId: 'sensitivity',
        explanation: 'Marked as suitable for sensitive skin in the catalog.',
      });
    }

    // Budget: only confirm within budget if price AND currency AND market verified.
    let withinBudget: boolean | null = null;
    if (product.priceUnknown || product.priceUsd === undefined || !product.market) {
      withinBudget = null;
    } else if (preferences.budgetUsd !== undefined && product.priceUsd !== undefined) {
      withinBudget = product.priceUsd <= preferences.budgetUsd;
    }

    return {
      productId,
      reasons,
      withinBudget,
      priceUnknown: product.priceUnknown || product.priceUsd === undefined || !product.market,
    };
  });
}

/* ----------------------------- Full output -------------------------------- */

export interface RecommendationResult {
  prioritizedConcerns: PrioritizedConcern[];
  routine: RoutineStep[];
  /** All unique product IDs across the routine, with match details. */
  productMatches: Record<string, ProductMatch>;
  /** Honest note about what data was missing. */
  dataNotes: string[];
}

export const FOCUS_ESTIMATE_LABEL =
  'DERMALENS focus estimate — an application-generated way to help prioritize your routine. It is not a clinical severity score.';

/* --------------------------- Evidence Trail ------------------------------ */

export interface EvidenceTrailStep {
  stepId: string;
  part: 'morning' | 'evening';
  label: string;
  category: RoutineCategory;
  rationale: string;
  matchedProductIds: string[];
}

export interface EvidenceTrail {
  concernId: string;
  concernLabel: string;
  /** Actual YouCam raw_score (health-favorable, higher = healthier). */
  rawScore: number | null;
  /** Actual YouCam ui_score (health-favorable, higher = healthier). */
  uiScore: number | null;
  /** Whether YouCam returned a mask for this concern. */
  hasMask: boolean;
  /** DERMALENS application estimate (100 - rawScore), or null when unavailable. */
  focusEstimate: number | null;
  /** Routine steps linked to this concern or a matching goal. */
  relatedSteps: EvidenceTrailStep[];
  /** Whether this concern was boosted by a user-selected goal. */
  boostedByGoal: boolean;
  /** The goal that matched this concern, if any. */
  matchingGoal: UserGoal | null;
  /** What remains unknown about this concern. */
  unknowns: string[];
}

/**
 * Build an evidence trail for a single concern, tracing from the YouCam
 * measurement through to the routine steps it influenced. Never fabricates
 * scores or masks.
 */
export function buildEvidenceTrail(
  concernId: string,
  result: SkinAnalysisResult,
  preferences: UserPreferences,
  routine: RoutineStep[],
): EvidenceTrail | null {
  const concern = result.concerns.find((c) => c.id === concernId);
  if (!concern) return null;

  const hasValidRawScore =
    typeof concern.rawScore === 'number' && Number.isFinite(concern.rawScore);
  const focusEstimate = hasValidRawScore
    ? clampScore(100 - concern.rawScore)
    : null;

  const matchingGoal = Object.entries(GOAL_TO_CONCERN).find(
    ([, cid]) => cid === concernId,
  )?.[0] as UserGoal | undefined;
  const boostedByGoal = matchingGoal
    ? preferences.goals.includes(matchingGoal)
    : false;

  const relatedSteps: EvidenceTrailStep[] = routine
    .filter((step) => {
      if (step.category === 'treat') {
        return step.matchedProductIds.length > 0;
      }
      return true;
    })
    .filter((step) => {
      const products = step.matchedProductIds.map((id) =>
        PRODUCT_CATALOG.find((p) => p.id === id),
      );
      return products.some(
        (p) => p?.supportedConcerns.includes(concernId) || p?.supportedGoals.includes(matchingGoal as UserGoal),
      );
    })
    .map((step) => ({
      stepId: step.id,
      part: step.part,
      label: step.label,
      category: step.category,
      rationale: step.rationale,
      matchedProductIds: step.matchedProductIds,
    }));

  const unknowns: string[] = [];
  if (!concern.maskUrls || concern.maskUrls.length === 0) {
    unknowns.push(
      'YouCam did not return a visual mask for this concern, so no overlay is available.',
    );
  }
  if (!hasValidRawScore) {
    unknowns.push(
      'A valid raw score was not available for this concern, so a DERMALENS focus estimate could not be calculated.',
    );
  }
  unknowns.push(
    'Cosmetic image analysis cannot establish a medical diagnosis, determine the cause of a skin concern, or prove that any product will work.',
  );

  return {
    concernId,
    concernLabel: concern.label,
    rawScore: hasValidRawScore ? concern.rawScore : null,
    uiScore: typeof concern.uiScore === 'number' ? concern.uiScore : null,
    hasMask: (concern.maskUrls?.length ?? 0) > 0,
    focusEstimate,
    relatedSteps,
    boostedByGoal,
    matchingGoal: matchingGoal ?? null,
    unknowns,
  };
}

/**
 * Generate the full recommendation: prioritized concerns, routine, and
 * product matches. Deterministic — same inputs, same output.
 */
export function generateRecommendations(
  result: SkinAnalysisResult,
  preferences: UserPreferences,
): RecommendationResult {
  const prioritized = prioritizeConcerns(result, preferences);
  const routine = buildRoutine(result, preferences);

  const productMatches: Record<string, ProductMatch> = {};
  for (const step of routine) {
    const matches = buildProductMatches(step, preferences, result);
    for (const match of matches) {
      if (!productMatches[match.productId]) {
        productMatches[match.productId] = match;
      } else {
        // Merge reasons from additional steps.
        productMatches[match.productId].reasons = [
          ...productMatches[match.productId].reasons,
          ...match.reasons,
        ];
      }
    }
  }

  const dataNotes: string[] = [];
  if (result.concerns.length === 0) {
    dataNotes.push(
      'No standard concerns were returned by YouCam for this photo. The routine below is based on general best practices and your selected goals only.',
    );
  }
  const missingScores = result.concerns.filter(
    (c) => typeof c.rawScore !== 'number' || !Number.isFinite(c.rawScore),
  );
  if (missingScores.length > 0) {
    dataNotes.push(
      `Some concerns (${missingScores.map((c) => c.label).join(', ')}) did not include a valid raw score, so a focus estimate could not be calculated for them.`,
    );
  }
  if (
    preferences.sensitivity === 'sensitive' ||
    preferences.sensitivity === 'unsure'
  ) {
    dataNotes.push(
      'Because you indicated sensitive or uncertain skin sensitivity, optional targeted exfoliating actives have been excluded. Consult a qualified professional before adding actives.',
    );
  }

  return {
    prioritizedConcerns: prioritized,
    routine,
    productMatches,
    dataNotes,
  };
}
