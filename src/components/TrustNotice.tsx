import { ShieldAlert } from 'lucide-react';

interface TrustNoticeProps {
  variant?: 'inline' | 'card';
}

/** The not-a-medical-diagnosis disclaimer, reused across the app. */
export function TrustNotice({ variant = 'inline' }: TrustNoticeProps) {
  const body = (
    <>
      <strong className="font-semibold">Not a medical diagnosis.</strong>{' '}
      DERMALENS provides cosmetic, image-based observations for educational
      purposes only. It is not a substitute for advice from a qualified
      dermatologist or clinician. Results depend on photo quality, lighting and
      facial positioning. Your photo is sent to the YouCam API for processing
      and removed by the provider within 30 days.
    </>
  );

  if (variant === 'inline') {
    return (
      <p className="flex items-start gap-2.5 text-xs leading-relaxed text-charcoal-500">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-charcoal-400" />
        <span>{body}</span>
      </p>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-ivory-300 bg-ivory-100/70 p-4">
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-charcoal-400" />
      <p className="text-sm leading-relaxed text-charcoal-600">{body}</p>
    </div>
  );
}
