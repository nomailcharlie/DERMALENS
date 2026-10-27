import { Sparkles } from 'lucide-react';

interface LogoProps {
  variant?: 'full' | 'mark';
  className?: string;
  onHome?: () => void;
}

/** DERMALENS wordmark with the leaf-mark lens glyph. */
export function Logo({ variant = 'full', className = '', onHome }: LogoProps) {
  return (
    <button
      type="button"
      onClick={onHome}
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label="DERMALENS home"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-sage-700 text-ivory-50 transition-transform duration-300 group-hover:scale-105">
        <Sparkles className="h-4 w-4" strokeWidth={1.6} />
        <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-sage-500/40" />
      </span>
      {variant === 'full' && (
        <span className="flex flex-col items-start leading-none">
          <span className="font-serif text-lg font-semibold tracking-tightest text-charcoal-900">
            DERMALENS
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-charcoal-400">
            Skin Intelligence
          </span>
        </span>
      )}
    </button>
  );
}
