import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

/**
 * Display-only number reveal. Counts from the last shown value to `target`
 * with an ease-out curve; lands on the exact target. Under reduced motion it
 * returns the target immediately. Never alters the underlying data.
 */
export function useCountUp(target, { duration = 900, enabled = true } = {}) {
  const reduced = useReducedMotion();
  const to = Number(target) || 0;
  const fromRef = useRef(0);
  const [display, setDisplay] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!enabled) return undefined;

    if (reduced || fromRef.current === to) {
      fromRef.current = to;
      setDisplay(to);
      return undefined;
    }

    const from = fromRef.current;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      const value = from + (to - from) * eased;
      fromRef.current = t < 1 ? value : to;
      setDisplay(t < 1 ? Math.round(value) : to);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, enabled, reduced, duration]);

  return reduced ? to : display;
}
