import { useState } from 'react';
import { ABOUT_HEADING, ABOUT_PARAGRAPHS } from './about.ts';

function AboutModal({ onClose }: { onClose: () => void }): JSX.Element {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ABOUT_HEADING}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(26, 26, 26, 0.4)',
        zIndex: 10,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--surface-edge)',
          borderRadius: 8,
          padding: 'var(--space-6)',
          maxWidth: 720,
          maxHeight: '80vh',
          overflowY: 'auto',
          font: 'var(--weight-regular) var(--type-body) / var(--leading-body) var(--font-family)',
          color: 'var(--ink-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ font: 'var(--weight-semibold) var(--type-modal-heading) / var(--leading-tight) var(--font-family)', margin: '0 0 var(--space-4) 0' }}>
          {ABOUT_HEADING}
        </h2>
        {ABOUT_PARAGRAPHS.map((p, i) => (
          <p key={i} style={{ margin: '0 0 var(--space-4) 0' }}>
            {p}
          </p>
        ))}
        <button type="button" onClick={onClose} style={{ cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
}

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
      {open && <AboutModal onClose={() => setOpen(false)} />}
    </>
  );
}
