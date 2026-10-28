import {
  ExternalLink,
  Printer,
  X,
} from 'lucide-react';
import type {
  RoutineStep,
  SkinAnalysisResult,
  UserPreferences,
} from '@/types/analysis';
import {
  generateRecommendations,
  goalLabel,
  type RecommendationResult,
} from '@/lib/recommendationEngine';
import { getProductById } from '@/data/productCatalog';
import { TrustNotice } from './TrustNotice';

interface RoutinePassportProps {
  result: SkinAnalysisResult | null;
  preferences: UserPreferences;
  onClose: () => void;
}

export function RoutinePassport({
  result,
  preferences,
  onClose,
}: RoutinePassportProps) {
  const recommendations: RecommendationResult | null = result
    ? generateRecommendations(result, preferences)
    : null;

  const morning = recommendations?.routine.filter((s) => s.part === 'morning') ?? [];
  const evening = recommendations?.routine.filter((s) => s.part === 'evening') ?? [];
  const productMatches = recommendations?.productMatches ?? {};

  const topConcerns = result
    ? [...result.concerns]
        .sort((a, b) => {
          const fa = typeof a.rawScore === 'number' && Number.isFinite(a.rawScore) ? 100 - a.rawScore : -1;
          const fb = typeof b.rawScore === 'number' && Number.isFinite(b.rawScore) ? 100 - b.rawScore : -1;
          return fb - fa;
        })
        .slice(0, 4)
    : [];

  const isPersonalized = result !== null && result.concerns.length > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-charcoal-900/40 backdrop-blur-sm print:static print:z-auto print:overflow-visible print:bg-white print:backdrop-blur-none">
      {/* Screen-only close bar — hidden in print */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-ivory-200 bg-ivory-50/95 px-5 py-3 backdrop-blur-md print:hidden">
        <p className="text-sm font-medium text-charcoal-700">
          Routine Passport preview
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-5 py-2.5 text-sm font-medium text-ivory-50 shadow-soft transition-colors hover:bg-sage-800"
          >
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close passport"
            className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-600 transition-colors hover:bg-ivory-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Printable document */}
      <div
        id="passport-document"
        className="passport-doc mx-auto my-6 max-w-3xl rounded-3xl border border-ivory-200 bg-white p-8 shadow-lift sm:p-10 print:my-0 print:max-w-full print:rounded-none print:border-0 print:shadow-none print:p-6"
      >
        {/* Header */}
        <div className="flex items-end justify-between border-b-2 border-sage-700 pb-4">
          <div>
            <h1 className="font-serif text-3xl text-charcoal-900">DERMALENS</h1>
            <p className="mt-1 text-sm text-charcoal-500">
              {isPersonalized
                ? 'Personalized skincare routine plan'
                : 'General skincare routine plan'}
            </p>
          </div>
          <p className="text-right text-xs text-charcoal-400">
            Generated{' '}
            {new Date().toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Goals */}
        {preferences.goals.length > 0 && (
          <PassportSection title="Selected goals">
            <div className="flex flex-wrap gap-2">
              {preferences.goals.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-sage-300 bg-sage-50 px-3 py-1 text-xs font-medium text-sage-700"
                >
                  {goalLabel(g)}
                </span>
              ))}
            </div>
          </PassportSection>
        )}

        {/* Analysis summary */}
        {result && (
          <PassportSection
            title={isPersonalized ? 'Analysis summary' : 'Analysis results'}
          >
            {isPersonalized ? (
              <>
                <p className="text-xs text-charcoal-500">
                  Measured by the YouCam API. Scores are health-favorable —
                  higher means healthier skin. The DERMALENS focus estimate
                  (100 − raw score) is an app-generated prioritization hint.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {topConcerns.map((c) => {
                    const focus =
                      typeof c.rawScore === 'number' && Number.isFinite(c.rawScore)
                        ? Math.round(100 - c.rawScore)
                        : null;
                    return (
                      <div
                        key={c.id}
                        className="rounded-lg border border-ivory-200 bg-ivory-50 p-3"
                      >
                        <p className="text-sm font-medium text-charcoal-900">
                          {c.label}
                        </p>
                        <p className="mt-0.5 text-xs text-charcoal-500">
                          YouCam health: {c.uiScore}/100 · Raw: {c.rawScore.toFixed(1)}
                        </p>
                        {focus !== null && (
                          <p className="text-xs text-charcoal-600">
                            DERMALENS focus: {focus}/100
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-charcoal-500">
                YouCam returned no standard concerns for this photo. The routine
                below is based on general best practices and your selected goals.
              </p>
            )}
          </PassportSection>
        )}

        {!result && (
          <PassportSection title="Plan type">
            <p className="text-xs text-charcoal-500">
              No analysis was run. This is a general routine plan based on your
              selected goals and preferences only. It is not a personalized
              analysis report.
            </p>
          </PassportSection>
        )}

        {/* Morning routine */}
        <PassportSection title="Morning routine">
          <PassportSteps steps={morning} productMatches={productMatches} />
        </PassportSection>

        {/* Evening routine */}
        <PassportSection title="Evening routine">
          <PassportSteps steps={evening} productMatches={productMatches} />
        </PassportSection>

        {/* Sensitivity note */}
        {(preferences.sensitivity === 'sensitive' ||
          preferences.sensitivity === 'unsure') && (
          <PassportSection title="Sensitivity note">
            <p className="text-xs leading-relaxed text-charcoal-600">
              Because you indicated {preferences.sensitivity === 'sensitive' ? 'sensitive' : 'uncertain'}{' '}
              skin sensitivity, optional exfoliating actives have been excluded.
              Consult a qualified professional before adding actives.
            </p>
          </PassportSection>
        )}

        {/* Limitations */}
        <PassportSection title="Limitations & precautions">
          <ul className="space-y-1.5 text-xs leading-relaxed text-charcoal-600">
            <li>• All product prices are unverified. Check current regional pricing via the official manufacturer links.</li>
            <li>• Regional availability is not confirmed for any product.</li>
            <li>• Cosmetic image analysis does not establish a medical diagnosis or identify the cause of a skin condition.</li>
            <li>• No product efficacy is guaranteed. Recommendations are based on verified catalog attributes only.</li>
            <li>• Patch test any new product before regular use. Discontinue if irritation occurs.</li>
          </ul>
        </PassportSection>

        {/* Footer */}
        <div className="mt-8 border-t border-ivory-200 pt-4">
          <TrustNotice variant="card" />
          <p className="mt-3 text-center text-[10px] text-charcoal-300">
            This passport was generated client-side. No photo or personal data
            was uploaded to any external service.
          </p>
        </div>
      </div>
    </div>
  );
}

function PassportSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="passport-section mt-6 break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-sage-700">
        {title}
      </h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function PassportSteps({
  steps,
  productMatches,
}: {
  steps: RoutineStep[];
  productMatches: RecommendationResult['productMatches'];
}) {
  if (steps.length === 0) {
    return <p className="text-xs text-charcoal-400">No steps.</p>;
  }
  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        const products = step.matchedProductIds
          .map((id) => getProductById(id))
          .filter((p): p is NonNullable<typeof p> => p !== undefined);
        const match = products.length > 0 ? productMatches[products[0].id] : null;

        return (
          <li
            key={step.id}
            className="passport-step break-inside-avoid rounded-lg border border-ivory-200 bg-ivory-50 p-3.5"
          >
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-semibold text-sage-700">
                {step.order}.
              </span>
              <p className="text-sm font-medium text-charcoal-900">{step.label}</p>
              {step.optional && (
                <span className="rounded-full bg-ivory-200 px-2 py-0.5 text-[9px] uppercase tracking-wider text-charcoal-500">
                  Optional
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-charcoal-600">
              {step.purpose}
            </p>
            <p className="mt-1 text-[11px] italic text-charcoal-500">
              Why: {step.rationale}
            </p>

            {products.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-2 border-t border-ivory-200 pt-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-charcoal-700">
                        {p.brand} · {p.name}
                      </p>
                      <p className="text-[10px] text-charcoal-500">
                        {p.keyIngredients.join(', ')}
                      </p>
                      {match && match.reasons.length > 0 && (
                        <p className="mt-0.5 text-[10px] text-charcoal-500">
                          Match: {match.reasons[0].explanation}
                        </p>
                      )}
                      <p className="text-[10px] text-charcoal-400">
                        Price unverified · Availability not confirmed
                      </p>
                    </div>
                    <a
                      href={p.infoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-sage-700 hover:underline"
                    >
                      Info <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {step.precautions.length > 0 && (
              <div className="mt-2 rounded border border-terracotta-500/20 bg-terracotta-500/5 p-2">
                <p className="text-[9px] font-medium uppercase tracking-wider text-terracotta-600">
                  Precautions
                </p>
                <ul className="mt-1 space-y-0.5">
                  {step.precautions.map((pc, i) => (
                    <li key={i} className="text-[10px] leading-relaxed text-charcoal-600">
                      • {pc}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
