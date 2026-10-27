import { useEffect, useRef, useState } from 'react';

/**
 * Returns whether the page has scrolled past `threshold` px.
 * Used to transition the header background from transparent to solid.
 */
export function useScrolled(threshold = 24): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/**
 * Smoothly scrolls to an element id, accounting for the sticky header height.
 */
export function useScrollTo() {
  const ref = useRef<HTMLElement | null>(null);
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top, behavior: 'smooth' });
  };
  return { ref, scrollTo };
}
