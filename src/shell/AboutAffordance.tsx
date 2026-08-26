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
          font: 'var(--weight-medium) var(--type-legend) / var(--leading-tight) var(--font-family)',
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
