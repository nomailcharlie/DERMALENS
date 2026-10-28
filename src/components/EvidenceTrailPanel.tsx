import {
  ArrowLeft,
  ExternalLink,
  Eye,
  FlaskConical,
  HelpCircle,
  ImageOff,
  Layers,
  Route,
  ShieldAlert,
} from 'lucide-react';
import type { RoutineCategory, RoutineStep, SkinAnalysisResult, SkinOverlay, UserPreferences } from '@/types/analysis';
import {
  buildEvidenceTrail,
  goalLabel,
} from '@/lib/recommendationEngine';
import { getProductById } from '@/data/productCatalog';

interface EvidenceTrailPanelProps {
  concernId: string;
  result: SkinAnalysisResult;
  preferences: UserPreferences;
  routine: RoutineStep[];
  overlays: SkinOverlay[];
  onBack: () => void;
  onShowMask: (overlay: SkinOverlay | null) => void;
}

const CATEGORY_LABELS: Record<RoutineCategory, string> = {
  cleanse: 'Cleanse',
  moisturize: 'Moisturize',
  protect: 'Sun protection',
  treat: 'Optional targeted',
};

export function EvidenceTrailPanel({
  concernId,
  result,
  preferences,
  routine,
  overlays,
  onBack,
  onShowMask,
}: EvidenceTrailPanelProps) {
  const trail = buildEvidenceTrail(concernId, result, preferences, routine);
  if (!trail) return null;

  const concernOverlays = overlays.filter((o) => o.label === trail.concernLabel);

  return (
    <div className="animate-fade-in rounded-3xl border border-sage-200 bg-ivory-50 p-6 shadow-lift sm:p-8">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-ivory-300 px-3.5 py-1.5 text-xs font-medium text-charcoal-600 transition-colors hover:bg-ivory-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All concerns
      </button>

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
          <Route className="h-5 w-5" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-sage-700">
            Evidence trail
          </p>
          <h3 className="mt-1 text-xl">{trail.concernLabel}</h3>
        </div>
      </div>

      {/* Section A: What YouCam returned */}
      <TrailSection
        icon={<Eye className="h-4 w-4" />}
        title="What YouCam returned"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <DataTile
            label="Raw score (health)"
            value={
              trail.rawScore !== null
                ? trail.rawScore.toFixed(1)
                : 'Not available'
            }
            hint="Higher = healthier. From the YouCam model."
          />
          <DataTile
            label="UI score"
            value={
              trail.uiScore !== null
                ? String(trail.uiScore)
                : 'Not available'
            }
            hint="YouCam's display-calibrated score. Higher = healthier."
          />
        </div>

        <div className="mt-4">
          {concernOverlays.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {concernOverlays.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onShowMask(o)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sage-300 bg-sage-50 px-3.5 py-1.5 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-100"
                >
                  <Layers className="h-3.5 w-3.5" /> Show {o.label} mask
                </button>
              ))}
              <p className="text-[11px] text-charcoal-400">
                Mask links from YouCam are valid for 2 hours after analysis.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-ivory-200 bg-ivory-100/60 px-4 py-3 text-xs text-charcoal-500">
              <ImageOff className="h-4 w-4 shrink-0 text-charcoal-400" />
              YouCam did not return a visual mask for this concern.
            </div>
          )}
        </div>
      </TrailSection>

      {/* Section B: How DERMALENS interpreted it */}
      <TrailSection
        icon={<FlaskConical className="h-4 w-4" />}
        title="How DERMALENS interpreted it"
      >
        {trail.focusEstimate !== null ? (
          <>
            <p className="text-sm leading-relaxed text-charcoal-600">
              DERMALENS computes a <strong>focus estimate</strong> as{' '}
              <code className="rounded bg-ivory-200 px-1.5 py-0.5 text-xs">
                100 − raw_score
              </code>
              . For this concern that gives{' '}
              <strong className="text-charcoal-900">{trail.focusEstimate}/100</strong>.
              This is an application-generated prioritization hint —{' '}
              <em>not</em> a clinical severity score or a prediction of treatment
              benefit.
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ivory-200">
              <div
                className="h-full rounded-full bg-terracotta-500"
                style={{ width: `${trail.focusEstimate}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-sm leading-relaxed text-charcoal-600">
            A valid raw score was not available for this concern, so a DERMALENS
            focus estimate could not be calculated. The concern is listed but
            cannot be prioritized by the engine.
          </p>
        )}

        {trail.matchingGoal && trail.boostedByGoal && (
          <div className="mt-4 rounded-xl border border-sage-200 bg-sage-50 p-3.5 text-xs leading-relaxed text-charcoal-600">
            <p className="font-medium text-sage-700">User goal linked</p>
            <p className="mt-1">
              You selected the goal "{goalLabel(trail.matchingGoal)}," which
              DERMALENS maps to this concern. This is your{' '}
              <strong>preference</strong>, not a detection — it tells the engine
              to prioritize this area regardless of the YouCam score.
            </p>
          </div>
        )}
      </TrailSection>

      {/* Section C: How the routine responds */}
      <TrailSection
        icon={<Route className="h-4 w-4" />}
        title="How the routine responds"
      >
        {trail.relatedSteps.length > 0 ? (
          <div className="space-y-3">
            {trail.relatedSteps.map((step) => {
              const products = step.matchedProductIds
                .map((id) => getProductById(id))
                .filter((p): p is NonNullable<typeof p> => p !== undefined);
              return (
                <div
                  key={step.stepId}
                  className="rounded-xl border border-ivory-200 bg-ivory-100/50 p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-sage-700">
                      {step.part === 'morning' ? 'AM' : 'PM'}
                    </span>
                    <p className="text-sm font-medium text-charcoal-900">
                      {step.label}
                    </p>
                    <span className="text-xs text-charcoal-400">
                      · {CATEGORY_LABELS[step.category]}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-charcoal-600">
                    {step.rationale}
                  </p>
                  {products.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {products.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-charcoal-700">
                              {p.brand} · {p.name}
                            </p>
                            <p className="text-[11px] text-charcoal-500">
                              Verified: {p.keyIngredients.join(', ')}
                            </p>
                          </div>
                          <a
                            href={p.infoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-sage-700 hover:underline"
                          >
                            Info <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-charcoal-600">
            No routine steps were directly linked to this concern by the
            matching engine. The routine still includes foundational cleanse,
            moisturize and sun-protection steps that support overall skin
            health.
          </p>
        )}
      </TrailSection>

      {/* Section D: What remains unknown */}
      <TrailSection
        icon={<HelpCircle className="h-4 w-4" />}
        title="What remains unknown"
      >
        <ul className="space-y-2">
          {trail.unknowns.map((u, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs leading-relaxed text-charcoal-600"
            >
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-charcoal-400" />
              <span>{u}</span>
            </li>
          ))}
        </ul>
      </TrailSection>

      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-ivory-300 bg-ivory-100/70 p-4">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" />
        <p className="text-xs leading-relaxed text-charcoal-600">
          <strong className="font-semibold">Not a medical diagnosis.</strong>{' '}
          This evidence trail connects a cosmetic image analysis to routine
          suggestions. It does not identify the cause of any skin condition or
          guarantee that a product will work.
        </p>
      </div>
    </div>
  );
}

function TrailSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6 border-t border-ivory-200 pt-5">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-charcoal-500">
        <span className="text-sage-600">{icon}</span>
        {title}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function DataTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-ivory-200 bg-ivory-100/50 p-3.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-charcoal-400">
        {label}
      </p>
      <p className="mt-1 font-serif text-lg text-charcoal-900">{value}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-charcoal-500">{hint}</p>
    </div>
  );
}
