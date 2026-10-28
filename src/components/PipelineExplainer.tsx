import { useState } from 'react';
import { ChevronDown, GitBranch } from 'lucide-react';

const PIPELINE_STEPS = [
  {
    n: 1,
    title: 'User supplies a facial image',
    body: 'You upload a well-lit, front-facing photo. DERMALENS prepares it (resize, JPEG conversion) entirely in your browser before sending anything anywhere.',
    source: 'User',
  },
  {
    n: 2,
    title: 'Server securely forwards to YouCam',
    body: 'The analyze-skin Supabase Edge Function holds the YouCam API key server-side. The browser never sees the key. The function registers the file, uploads it, and creates a YouCam analysis task.',
    source: 'DERMALENS server',
  },
  {
    n: 3,
    title: 'DERMALENS displays provider results',
    body: 'YouCam returns health-favorable scores (higher = healthier) and optional visual masks. DERMALENS shows these exactly as returned, clearly labelled "Measured by the YouCam API."',
    source: 'YouCam API',
  },
  {
    n: 4,
    title: 'Deterministic engine prioritizes concerns',
    body: 'A transparent, deterministic engine ranks concerns using the DERMALENS focus estimate (100 − raw score). Your selected goals can boost a concern to the top — but a goal is a preference, not a detection.',
    source: 'DERMALENS engine',
  },
  {
    n: 5,
    title: 'Routine and product shortlist generated',
    body: 'The engine builds morning and evening steps and matches products from a curated catalog using only verified fields (supported goals, detected concerns, category, sensitivity suitability). No fabricated claims.',
    source: 'DERMALENS engine',
  },
  {
    n: 6,
    title: 'Unverified data is explicitly excluded',
    body: 'Prices, regional availability, and medical conclusions are never fabricated. Unverified items show "Check current regional price." Cosmetic analysis is not a medical diagnosis.',
    source: 'DERMALENS',
  },
];

export function PipelineExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-ivory-200 bg-ivory-50 p-6 shadow-soft sm:p-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2.5">
          <GitBranch className="h-5 w-5 text-sage-700" />
          <h3 className="text-lg">How DERMALENS makes a recommendation</h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-charcoal-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="mt-6 animate-fade-in">
          <p className="text-sm leading-relaxed text-charcoal-600">
            Understanding which part is YouCam's analysis and which part is
            DERMALENS application logic:
          </p>
          <ol className="mt-5 space-y-4">
            {PIPELINE_STEPS.map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100 font-serif text-sm font-semibold text-sage-700">
                  {step.n}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-charcoal-900">
                      {step.title}
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                        step.source === 'YouCam API'
                          ? 'bg-terracotta-500/10 text-terracotta-600'
                          : 'bg-sage-100 text-sage-700'
                      }`}
                    >
                      {step.source}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-6 rounded-xl border border-sage-200 bg-sage-50/60 p-4">
            <p className="text-xs leading-relaxed text-charcoal-600">
              <strong className="font-semibold text-sage-700">
                YouCam vs DERMALENS:
              </strong>{' '}
              YouCam provides the skin measurements (scores and masks). DERMALENS
              provides the focus estimate, routine structure, product matching,
              and all explanations. YouCam does not generate the routine or
              guarantee product efficacy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
