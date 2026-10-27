import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { useScrolled } from '@/lib/useScroll';

interface HeaderProps {
  onNavigate: (id: string) => void;
}

const NAV = [
  { id: 'scan', label: 'Scan' },
  { id: 'how', label: 'How it works' },
  { id: 'routine', label: 'Routine' },
  { id: 'trust', label: 'Trust' },
];

export function Header({ onNavigate }: HeaderProps) {
  const scrolled = useScrolled(16);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-ivory-200 bg-ivory-50/90 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="container-page flex h-[68px] items-center justify-between">
        <Logo onHome={() => go('top')} />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              className="rounded-full px-4 py-2 text-sm font-medium text-charcoal-600 transition-colors hover:bg-ivory-100 hover:text-charcoal-900"
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden md:block">
          <button
            type="button"
            onClick={() => go('scan')}
            className="rounded-full bg-charcoal-900 px-5 py-2.5 text-sm font-medium text-ivory-50 shadow-soft transition-all duration-300 hover:bg-charcoal-800 hover:shadow-lift active:scale-[0.98]"
          >
            Analyze my skin
          </button>
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-charcoal-700 hover:bg-ivory-100 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-ivory-200 bg-ivory-50 md:hidden">
          <nav className="container-page flex flex-col gap-1 py-4">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className="rounded-xl px-4 py-3 text-left text-base font-medium text-charcoal-700 hover:bg-ivory-100"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => go('scan')}
              className="mt-2 rounded-full bg-charcoal-900 px-5 py-3 text-center text-base font-medium text-ivory-50"
            >
              Analyze my skin
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
