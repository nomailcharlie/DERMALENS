import { AlertOctagon, Info } from 'lucide-react';
import type { SkinConcern } from '@/types/analysis';

interface ConcernCardProps {
  concern: SkinConcern;
}

/**
 * Single measured concern card.
 *
 * YouCam scores are health-favorable: a HIGHER ui_score / raw_score means
 * HEALTHIER skin, not a more severe problem. We therefore show the YouCam
 * score as a "skin health" reading, and separately surface a DERMALENS
 * `focusEstimate` (100 - raw_score) as an application-level hint for where
 * a routine might help — clearly labelled as our estimate, not a YouCam
 * severity score.
 */
export function ConcernCard({ concern }: ConcernCardProps) {
  const healthPct = Math.max(0, Math.min(100, concern.uiScore));
  const focusPct = Math.max(0, Math.min(100, concern.focusEstimate));

  return (
    <div className="rounded-2xl border border-ivory-200 bg-ivory-50 p-5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium text-charcoal-900">
            {concern.label}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-charcoal-500">
            {concern.description}
          </p>
        </div>
        {concern.maskUrls.length > 0 && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-xs font-medium text-sage-700">
            <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />
            Mask
          </span>
        )}
      </div>

      {/* YouCam health score — higher is healthier */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wider text-charcoal-400">
            YouCam health score
          </span>
          <span className="font-serif text-xl tabular-nums text-charcoal-900">
            {concern.uiScore}
            <span className="text-sm text-charcoal-400">/100</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ivory-200">
          <div
            className="h-full rounded-full bg-sage-500 transition-[width] duration-700 ease-out"
            style={{ width: `${healthPct}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-charcoal-400">
          Higher is healthier. YouCam raw score {concern.rawScore.toFixed(1)}.
        </p>
      </div>

      {/* DERMALENS focus estimate — derived, clearly labelled */}
      <div className="mt-4 rounded-xl bg-ivory-100/70 p-3">
        <div className="flex items-baseline justify-between">
          <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-charcoal-500">
            <Info className="h-3 w-3" /> DERMALENS focus estimate
          </span>
          <span className="text-sm tabular-nums text-charcoal-700">{focusPct}/100</span>
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-ivory-200">
          <div
            className="h-full rounded-full bg-terracotta-500 transition-[width] duration-700 ease-out"
            style={{ width: `${focusPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-charcoal-400">
          An application-generated prioritization hint (100 minus the raw score).
          Not a clinical severity score or a prediction of treatment benefit.
        </p>
      </div>
    </div>
  );
}

/** Placeholder shown when the API returned no concerns for this section. */
export function ConcernEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ivory-300 bg-ivory-50/50 p-8 text-center">
      <AlertOctagon className="h-6 w-6 text-charcoal-300" />
      <p className="mt-3 text-sm text-charcoal-500">
        No {label} readings were available for this photo.
      </p>
    </div>
  );
}
