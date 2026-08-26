import { moduleRegistry } from '../declarations/registry.ts';
import { RegisterField } from '../shell/RegisterField.tsx';

// Decision-support tool, not shipped UI. The commit that found this
// (017a512) confirmed tiles and register rows already run byte-for-byte
// identical scrim CSS, so the visual difference reported is real and
// perceptual — a wide flat register row veils more strongly than a small
// bounded tile at the same opacity. Contrast math can't settle which
// value reads right; only looking at the real thing can, which is
// exactly how 0.32 -> 0.28 was settled for tiles (DD v0.9.6: "reasoned
// against computed values... untested in fact" until a board existed).
// So: three candidates, applied to real register content via a locally
// scoped --scrim override (the actual .scrim/::after CSS, unmodified —
// only the custom property's value changes per column), for the
// Coordinator to look at and choose from directly.
const CANDIDATES = [
  { opacity: 0.28, label: 'Current (tile value, unchanged)' },
  { opacity: 0.24, label: 'Candidate A — 0.24' },
  { opacity: 0.2, label: 'Candidate B — 0.20' },
  { opacity: 0.16, label: 'Candidate C — 0.16' },
];

export function ScrimCandidates(): JSX.Element {
  // A representative, genuinely inactive slice — two full rows' worth —
  // rather than the whole board, so the comparison is fast to scan.
  const sample = moduleRegistry.filter((d) => d.status !== 'live').slice(0, 6);

  return (
    <div style={{ padding: 32, background: 'var(--ground)', minHeight: '100vh', fontFamily: 'var(--font-family)' }}>
      <h1 style={{ font: 'var(--weight-semibold) var(--type-modal-heading) / var(--leading-tight) var(--font-family)', marginBottom: 8 }}>
        Register scrim — candidate comparison
      </h1>
      <p style={{ color: 'var(--ink-tertiary)', marginBottom: 32, maxWidth: 600 }}>
        Same register content, four scrim values. Column 1 is the current tile
        value (0.28) applied to register rows, for reference — this is the one
        the Coordinator flagged as reading heavier on a wide row than on a
        tile. Columns 2–4 are candidates. Not part of the shipped app.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${CANDIDATES.length}, 1fr)`, gap: 24 }}>
        {CANDIDATES.map((c) => (
          <div key={c.opacity} style={{ '--scrim': `rgba(244, 243, 239, ${c.opacity})` } as React.CSSProperties}>
            <div
              style={{
                font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)',
                color: 'var(--ink-secondary)',
                marginBottom: 12,
              }}
            >
              {c.label}
            </div>
            <RegisterField declarations={sample} horizon="month" />
          </div>
        ))}
      </div>
    </div>
  );
}
