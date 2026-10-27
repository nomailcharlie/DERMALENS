import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Info,
  Lock,
  Moon,
  Sparkles,
  Sun,
  Target,
  Wallet,
} from 'lucide-react';
import type {
  RoutineStep,
  SkinAnalysisResult,
  UserGoal,
  UserPreferences,
  RoutineIntensity,
  SensitivityLevel,
} from '@/types/analysis';
import {
  generateRecommendations,
  goalLabel,
  FOCUS_ESTIMATE_LABEL,
} from '@/lib/recommendationEngine';
import { ProductCard } from './ProductCard';
import { TrustNotice } from './TrustNotice';

interface RoutineSectionProps {
  hasResults: boolean;
  result?: SkinAnalysisResult | null;
}

const ALL_GOALS: UserGoal[] = [
  'breakout_prone',
  'pores',
  'texture',
  'fine_lines',
  'simpler_routine',
];

const INTENSITY_TIERS: { id: RoutineIntensity; label: string; desc: string }[] = [
  { id: 'essential', label: 'Essentials', desc: 'Minimal steps, multi-purpose' },
  { id: 'balanced', label: 'Balanced', desc: 'A complete, considered routine' },
  { id: 'targeted', label: 'Optional targeted step', desc: 'Adds one optional active' },
];

const SENSITIVITY_OPTIONS: { id: SensitivityLevel; label: string }[] = [
  { id: 'none', label: 'No' },
  { id: 'sensitive', label: 'Yes' },
  { id: 'unsure', label: 'Unsure' },
];

export function RoutineSection({ hasResults, result }: RoutineSectionProps) {
  const [part, setPart] = useState<'morning' | 'evening'>('morning');
  const [selectedGoals, setSelectedGoals] = useState<UserGoal[]>([]);
  const [intensity, setIntensity] = useState<RoutineIntensity>('balanced');
  const [sensitivity, setSensitivity] = useState<SensitivityLevel>('none');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const preferences: UserPreferences = useMemo(
    () => ({ goals: selectedGoals, intensity, sensitivity }),
    [selectedGoals, intensity, sensitivity],
  );

  const recommendations = useMemo(() => {
    if (!result) return null;
    return generateRecommendations(result, preferences);
  }, [result, preferences]);

  const routineSteps = useMemo(() => {
    if (!recommendations) return [];
    return recommendations.routine.filter((s) => s.part === part);
  }, [recommendations, part]);

  const handleGoalToggle = (goal: UserGoal) => {
    setSelectedGoals((prev) => {
      if (prev.includes(goal)) return prev.filter((g) => g !== goal);
      if (prev.length >= 2) return [prev[1], goal]; // keep last + new
      return [...prev, goal];
    });
  };

  return (
    <section id="routine" className="scroll-mt-24 py-24 sm:py-32">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-charcoal-400">
            Routine & products
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Turn readings into a routine you can follow
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-charcoal-600">
            Select your goals and preferences. DERMALENS maps your measured
            concerns to transparent morning and evening steps — and explains why
            each product appears.
          </p>
        </div>

        {/* Goals selector */}
        <div className="mt-12 rounded-3xl border border-ivory-200 bg-ivory-50 p-6 shadow-soft sm:p-8">
          <div className="flex items-center gap-2.5">
            <Target className="h-5 w-5 text-sage-700" />
            <h3 className="text-lg">Your goals</h3>
            <span className="text-xs text-charcoal-400">
              Choose up to two (optional)
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {ALL_GOALS.map((goal) => {
              const active = selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => handleGoalToggle(goal)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'border-sage-600 bg-sage-600 text-ivory-50 shadow-soft'
                      : 'border-ivory-300 bg-ivory-50 text-charcoal-600 hover:border-sage-400'
                  }`}
                >
                  {goalLabel(goal)}
                </button>
              );
            })}
          </div>
          {selectedGoals.length > 0 && (
            <p className="mt-3 text-xs text-charcoal-500">
              Goals reflect what you want to focus on — they are separate from
              what YouCam detected.
            </p>
          )}
        </div>

        {/* Intensity + sensitivity */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-ivory-200 bg-ivory-50 p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-sage-700" />
              <h3 className="text-lg">Routine style</h3>
            </div>
            <div className="mt-4 space-y-2.5">
              {INTENSITY_TIERS.map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setIntensity(tier.id)}
                  aria-pressed={intensity === tier.id}
                  className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-all duration-200 ${
                    intensity === tier.id
                      ? 'border-sage-600 bg-sage-50 shadow-soft'
                      : 'border-ivory-200 bg-ivory-50 hover:border-sage-300'
                  }`}
                >
                  <div>
                    <p className="font-medium text-charcoal-900">{tier.label}</p>
                    <p className="mt-0.5 text-xs text-charcoal-500">{tier.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-ivory-200 bg-ivory-50 p-6 shadow-soft">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-sage-700" />
              <h3 className="text-lg">Skin sensitivity</h3>
            </div>
            <p className="mt-2 text-xs text-charcoal-500">
              Sensitive or unsure? We’ll exclude optional exfoliating actives.
            </p>
            <div className="mt-4 flex gap-2.5">
              {SENSITIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSensitivity(opt.id)}
                  aria-pressed={sensitivity === opt.id}
                  className={`flex-1 rounded-2xl border p-3 text-center text-sm font-medium transition-all duration-200 ${
                    sensitivity === opt.id
                      ? 'border-sage-600 bg-sage-50 text-sage-700 shadow-soft'
                      : 'border-ivory-200 bg-ivory-50 text-charcoal-600 hover:border-sage-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Honest budget disclosure */}
        <div className="mt-6 rounded-2xl border border-ivory-200 bg-ivory-50/80 p-5">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-charcoal-500">
            <Wallet className="h-4 w-4" /> About spending preferences
          </p>
          <p className="mt-2 text-xs leading-relaxed text-charcoal-500">
            Your routine style guides how many steps are included, but DERMALENS
            cannot confirm whether a product fits your budget. All catalog prices
            are currently unverified, so no item is marked as affordable. Each
            product card shows “Check current regional price” and links to the
            official manufacturer information page for current pricing.
          </p>
        </div>

        {!hasResults && (
          <div className="mt-8 rounded-2xl border border-dashed border-terracotta-500/40 bg-terracotta-500/5 p-5 text-center">
            <p className="text-sm leading-relaxed text-charcoal-700">
              <strong className="font-semibold">Run a skin analysis</strong> to
              tailor these steps to your measured concerns. Without results, the
              routine below is based on general best practices and your selected
              goals only.
            </p>
          </div>
        )}

        {/* Routine part toggle */}
        <div className="mt-10 flex items-center justify-center">
          <div
            role="tablist"
            aria-label="Routine part"
            className="inline-flex rounded-full border border-ivory-300 bg-ivory-100 p-1"
          >
            <PartTab
              active={part === 'morning'}
              onClick={() => setPart('morning')}
              icon={<Sun className="h-4 w-4" />}
              label="Morning"
            />
            <PartTab
              active={part === 'evening'}
              onClick={() => setPart('evening')}
              icon={<Moon className="h-4 w-4" />}
              label="Evening"
            />
          </div>
        </div>

        {/* Steps */}
        <ol className="mx-auto mt-8 max-w-2xl space-y-3">
          {routineSteps.map((step) => (
            <RoutineStepRow
              key={step.id}
              step={step}
              expanded={expandedStep === step.id}
              onToggle={() =>
                setExpandedStep(expandedStep === step.id ? null : step.id)
              }
            />
          ))}
        </ol>

        {/* Data notes */}
        {recommendations && recommendations.dataNotes.length > 0 && (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-ivory-300 bg-ivory-100/70 p-5">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-charcoal-500">
              <Info className="h-4 w-4" /> What we know and don’t know
            </p>
            <ul className="mt-3 space-y-2">
              {recommendations.dataNotes.map((note, i) => (
                <li
                  key={i}
                  className="text-sm leading-relaxed text-charcoal-600"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Focus estimate label */}
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-charcoal-400">
          {FOCUS_ESTIMATE_LABEL}
        </p>

        {/* Product shortlist */}
        {recommendations && Object.keys(recommendations.productMatches).length > 0 && (
          <div className="mt-16">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-charcoal-400">
                Curated products
              </p>
              <h2 className="mt-3 text-2xl sm:text-3xl">
                Transparent product shortlist
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-charcoal-600">
                Each product is matched to your routine with an explanation.
                Prices and regional availability are shown only when verified.
              </p>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(recommendations.productMatches).map(([id, match]) => (
                <ProductCard key={id} match={match} />
              ))}
            </div>
          </div>
        )}

        {/* "Why these recommendations?" */}
        {recommendations && (
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl border border-sage-200 bg-sage-50/50 p-6 sm:p-8">
            <h3 className="text-lg">Why these recommendations?</h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-charcoal-600">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                <span>
                  Your routine steps are based on your YouCam analysis results
                  {selectedGoals.length > 0
                    ? ' and the goals you selected.'
                    : '.'}{' '}
                  Goals are clearly separate from detected concerns.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                <span>
                  Product matches use only verified catalog fields — supported
                  goals, detected concerns, and manufacturer-documented
                  ingredients. No fabricated claims.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                <span>
                  Sensitive or unsure skin suppresses optional exfoliating
                  actives automatically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-500" />
                <span>
                  Prices and availability are shown only when verified against
                  the manufacturer source. Unverified items show “Check current
                  regional price.”
                </span>
              </li>
              {recommendations.dataNotes.map((note, i) => (
                <li key={`note-${i}`} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta-500" />
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mx-auto mt-10 max-w-2xl">
          <TrustNotice variant="card" />
        </div>
      </div>
    </section>
  );
}

function RoutineStepRow({
  step,
  expanded,
  onToggle,
}: {
  step: RoutineStep;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasProducts = step.matchedProductIds.length > 0;
  return (
    <li className="rounded-2xl border border-ivory-200 bg-ivory-50 shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-4 text-left"
        aria-expanded={expanded}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-sm font-semibold text-sage-700">
          {step.order}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-charcoal-900">{step.label}</p>
            {step.optional && (
              <span className="rounded-full bg-ivory-200 px-2 py-0.5 text-[10px] uppercase tracking-wider text-charcoal-500">
                Optional
              </span>
            )}
          </div>
          <p className="text-xs uppercase tracking-wider text-charcoal-400">
            {step.part === 'morning' ? 'AM' : 'PM'} · {step.category}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ivory-100 px-3 py-1.5 text-xs font-medium text-charcoal-500">
          {hasProducts ? (
            <span>{step.matchedProductIds.length} match{step.matchedProductIds.length > 1 ? 'es' : ''}</span>
          ) : (
            <><Lock className="h-3 w-3" /> No match</>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-charcoal-400 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expanded && (
        <div className="border-t border-ivory-200 px-4 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                Purpose
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">
                {step.purpose}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                What to look for
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">
                {step.productCharacteristics}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                How to apply
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">
                {step.applicationNote}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                Why this step
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-600">
                {step.rationale}
              </p>
            </div>
          </div>
          {step.precautions.length > 0 && (
            <div className="mt-4 rounded-xl border border-terracotta-500/20 bg-terracotta-500/5 p-3">
              <p className="text-xs font-medium text-terracotta-600">
                Precautions
              </p>
              <ul className="mt-1.5 space-y-1">
                {step.precautions.map((p, i) => (
                  <li
                    key={i}
                    className="text-[11px] leading-relaxed text-charcoal-600"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function PartTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-charcoal-900 text-ivory-50 shadow-soft'
          : 'text-charcoal-600 hover:text-charcoal-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
