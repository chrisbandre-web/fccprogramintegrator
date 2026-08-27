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
          // PROVISIONAL, not yet a token -- 24 canvas, up from
          // --type-legend (16). Coordinator direction, 27 Aug 2026:
          // "closer in size to Month/Quarter/Year," and positioned near
          // the bottom of the panel (NavigationFrame.tsx's marginTop:
          // auto wrapper), filling space that used to sit empty.
          font: 'var(--weight-medium) 24px / var(--leading-tight) var(--font-family)',
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
