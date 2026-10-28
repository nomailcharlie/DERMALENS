import { ArrowRight, Camera, Eye, Lightbulb, ScanLine, Sparkles, Play } from 'lucide-react';
import { PhotoUpload, UploadError } from './PhotoUpload';
import { TrustNotice } from './TrustNotice';

interface ScanSectionProps {
  previewUrl: string | null;
  uploadError: string | null;
  onFileSelected: (file: File | null, error: string | null) => void;
  onClear: () => void;
  onDismissError: () => void;
  onAnalyze: () => void;
  canAnalyze: boolean;
  /** Whether a saved demo fixture is available. */
  demoAvailable: boolean;
  /** Load and display the saved demo. */
  onTryDemo: () => void;
  /** Whether the demo is currently loading. */
  demoLoading: boolean;
}

const STEPS = [
  {
    icon: ScanLine,
    title: 'Capture',
    body: 'Upload a well-lit, front-facing photo with no makeup or filters.',
  },
  {
    icon: Eye,
    title: 'Analyze',
    body: 'AI measures visible concerns like acne, pores, texture and wrinkles.'
  },
  {
    icon: Sparkles,
    title: 'Plan',
    body: 'Turn the readings into a transparent morning and evening routine.',
  },
];

export function ScanSection({
  previewUrl,
  uploadError,
  onFileSelected,
  onClear,
  onDismissError,
  onAnalyze,
  canAnalyze,
  demoAvailable,
  onTryDemo,
  demoLoading,
}: ScanSectionProps) {
  return (
    <section id="scan" className="relative scroll-mt-24 pt-28 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-sage-50 via-ivory-50 to-ivory-50"
      />
      <div id="top" className="container-page">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Left: editorial copy */}
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-sage-50 px-3.5 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-sage-700">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
              AI Skin Intelligence
            </span>
            <h1 className="mt-6 text-balance text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Understand your skin.
              <br />
              <span className="text-sage-700">Choose your next step</span>
              <br />
              with confidence.
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-charcoal-600 sm:text-lg">
              DERMALENS reads a single photo to surface the concerns that matter
              for your skin today — then maps them to a transparent routine you
              can actually follow. No guesswork, no hype.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="group inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-6 py-3.5 text-sm font-medium text-ivory-50 shadow-soft transition-all duration-300 hover:bg-charcoal-800 hover:shadow-lift active:scale-[0.98]"
              >
                Analyze my photo
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              {demoAvailable && (
                <button
                  type="button"
                  onClick={onTryDemo}
                  disabled={demoLoading}
                  className="group inline-flex items-center gap-2 rounded-full border border-sage-300 bg-sage-50 px-6 py-3.5 text-sm font-medium text-sage-700 shadow-soft transition-all duration-300 hover:bg-sage-100 hover:shadow-lift active:scale-[0.98] disabled:opacity-60"
                >
                  {demoLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-sage-400 border-t-sage-700" />
                      Loading demo…
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Try the demo
                    </>
                  )}
                </button>
              )}
              <a
                href="#how"
                className="rounded-full border border-ivory-300 px-6 py-3.5 text-sm font-medium text-charcoal-700 transition-colors hover:border-charcoal-300 hover:bg-ivory-100"
              >
                How it works
              </a>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-ivory-200 pt-8">
              {[
                ['~60s', 'To results'],
                ['4', 'Concerns measured'],
                ['0', 'Photos stored'],
              ].map(([stat, label]) => (
                <div key={label}>
                  <dt className="font-serif text-2xl text-charcoal-900">{stat}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-charcoal-400">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right: upload card */}
          <div id="upload" className="animate-scale-in scroll-mt-24">
            <div className="rounded-[28px] border border-ivory-200 bg-ivory-50 p-5 shadow-lift sm:p-7">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg">Your photo</h2>
                <span className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
                  Step 1 of 3
                </span>
              </div>

              <PhotoUpload
                previewUrl={previewUrl}
                onFileSelected={onFileSelected}
                onClear={onClear}
              />

              {uploadError && (
                <UploadError message={uploadError} onDismiss={onDismissError} />
              )}

              {/* Concise photo tips */}
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-ivory-200 bg-ivory-100/60 p-3">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage-600" />
                <div className="text-[11px] leading-relaxed text-charcoal-500">
                  <p className="font-medium text-charcoal-600">Photo tips</p>
                  <p className="mt-0.5">
                    Face the camera directly, eyes level, nose centered. Fill most
                    of the frame with your face. Use even lighting and no filters.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={onAnalyze}
                  disabled={!canAnalyze}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-4 text-sm font-semibold text-ivory-50 shadow-soft transition-all duration-300 enabled:hover:bg-sage-800 enabled:hover:shadow-lift enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-ivory-300 disabled:text-charcoal-400"
                >
                  <Camera className="h-4 w-4" />
                  Analyze my skin
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-enabled:group-hover:translate-x-0.5" />
                </button>
                <div className="mt-4">
                  <TrustNotice />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div id="how" className="mt-24 scroll-mt-24 sm:mt-32">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-charcoal-400">
              How it works
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl">
              Three calm steps between you and clarity
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="group relative rounded-3xl border border-ivory-200 bg-ivory-50 p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
              >
                <span className="absolute right-6 top-6 font-serif text-5xl text-ivory-200 transition-colors group-hover:text-sage-200">
                  {i + 1}
                </span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                  <step.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <h3 className="mt-5 text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
