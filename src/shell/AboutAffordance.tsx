import { useState } from 'react';
import { AboutModal } from './AboutModal.tsx';

export function AboutAffordance(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        style={{
          // PROVISIONAL, not yet a token -- 28 canvas, up from 24
          // (itself up from --type-legend's 16). Coordinator direction,
          // 27 Aug 2026, second pass: larger again, and centered
          // (NavigationFrame.tsx's wrapper now does the centering).
          font: 'var(--weight-medium) 28px / var(--leading-tight) var(--font-family)',
          color: 'var(--accent)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        About
      </button>
      <AboutModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
