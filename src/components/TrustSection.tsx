import {
  Eye,
  ImageOff,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

const PILLARS = [
  {
    icon: Stethoscope,
    title: 'Not a medical diagnosis',
    body: 'DERMALENS offers cosmetic observations only. Always consult a licensed dermatologist for diagnosis or treatment of skin conditions.',
  },
  {
    icon: Eye,
    title: 'Results depend on image quality',
    body: 'Lighting, focus, angle and whether makeup or filters are present all affect accuracy. Use a clean, well-lit, front-facing photo.',
  },
  {
    icon: ImageOff,
    title: 'How your photo is handled',
    body: 'DERMALENS does not store your photo in its own database. It is transmitted to the YouCam API for analysis, where uploaded and generated files are automatically removed after 30 days. Result download links are valid for 2 hours after processing completes.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest about limits',
    body: 'We never fabricate scores or product claims. Where data is not yet connected, the app says so clearly.',
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="scroll-mt-24 border-t border-ivory-200 bg-ivory-100/50 py-24 sm:py-32">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-charcoal-400">
            Trust & usability
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl">
            Built to be honest before it&apos;s clever
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-3xl border border-ivory-200 bg-ivory-50 p-7 shadow-soft"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
                <p.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h3 className="mt-5 text-lg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
