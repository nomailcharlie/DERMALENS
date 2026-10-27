import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (id: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-ivory-200 bg-ivory-50">
      <div className="container-page py-14">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-start">
          <div className="max-w-sm">
            <Logo onHome={() => onNavigate('top')} />
            <p className="mt-4 text-sm leading-relaxed text-charcoal-500">
              Understand your skin. Choose your next step with confidence. An
              AI skincare intelligence experience built for the YouCam Skin AI
              &amp; eCommerce VTO Hackathon.
            </p>
            <p className="mt-4 text-xs text-charcoal-400">
              DERMALENS does not provide medical advice. Always consult a
              qualified dermatologist.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm">
            <button onClick={() => onNavigate('scan')} className="text-left text-charcoal-600 hover:text-charcoal-900">Scan</button>
            <button onClick={() => onNavigate('how')} className="text-left text-charcoal-600 hover:text-charcoal-900">How it works</button>
            <button onClick={() => onNavigate('routine')} className="text-left text-charcoal-600 hover:text-charcoal-900">Routine</button>
            <button onClick={() => onNavigate('trust')} className="text-left text-charcoal-600 hover:text-charcoal-900">Trust</button>
          </nav>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-ivory-200 pt-6 text-xs text-charcoal-400 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} DERMALENS. All rights reserved.</p>
          <p>Phase 1 — Premium Product Foundation</p>
        </div>
      </div>
    </footer>
  );
}
