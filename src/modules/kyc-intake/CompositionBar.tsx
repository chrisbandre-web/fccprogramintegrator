import type { Composition } from './selectors.ts';

// TAD §D.6.6 — one 100% stacked composition of High / Medium / Low with
// High anchored at the left edge, so every High segment starts at the
// same point and is comparable down the column. Built from flex children
// with percentage widths — there is no chart library (§F.23). Labels are
// always present (Rule E — colour is never alone).
//
// Purely presentational. Selection lives one level up, on the group that
// contains a bar (§D.6.5's Comparison: a pair of bars is one destination,
// not two) — this component used to be its own <button>, nested inside
// the group's clickable container. Nested interactive elements are a real
// bug, not a style choice: a disabled inner <button> swallows the click
// before it reaches the group's own handler, since disabled form controls
// don't dispatch (and in most browsers don't bubble) click events. Found
// live, 24 Aug 2026 — clicking a bar did nothing.
//
// Touch Two Amendment 1 §3 — the Comparison's segments must carry their
// own percentage value; a sidebar key names what the colours mean in
// general, not what this segment is. Each segment shows its value where
// it's wide enough to hold the type at the 12.0-rendered floor;
// otherwise the value moves adjacent to the bar rather than being
// dropped. Percentage-of-bar-width stands in for a real DOM measurement
// here (no ResizeObserver) — 8% is comfortably wide enough for "12%" at
// --type-legend in every container width this build actually renders at;
// narrower than that, three-character text starts to crowd or overflow
// its own segment. Label ink per fcc-tokens.css §6: --ink-primary on low
// and medium, --surface (light on dark) on high.
//
// CONFIRMED as intended behaviour, not a shortcut to tidy later (Design
// System owner review, verified at magnification, 26 Aug 2026): the
// dominant segment's label inline plus the narrow ones stacked below the
// bar ("High 5% Medium 3%") reads more cleanly than a crowded bar and
// keeps Rule E satisfied at every width — better than the spec's own
// "adjacent" framing anticipated, and should stay this way into phase 6.
const INLINE_LABEL_THRESHOLD = 8;

interface Segment {
  key: 'high' | 'medium' | 'low';
  pct: number;
  fill: string;
  ink: string;
}

function segmentLabel(pct: number): string {
  return `${Math.round(pct)}%`;
}

export function CompositionBar({ label, composition }: { label: string; composition: Composition }): JSX.Element {
  const segments: Segment[] = [
    { key: 'high', pct: composition.high, fill: 'var(--risk-bar-high)', ink: 'var(--surface)' },
    { key: 'medium', pct: composition.medium, fill: 'var(--risk-bar-medium)', ink: 'var(--ink-primary)' },
    { key: 'low', pct: composition.low, fill: 'var(--risk-bar-low)', ink: 'var(--ink-primary)' },
  ];
  const overflow = composition.total > 0 ? segments.filter((s) => s.pct > 0 && s.pct < INLINE_LABEL_THRESHOLD) : [];

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-secondary)' }}>
            {label}
          </span>
          {composition.total === 0 ? (
            <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
              no records
            </span>
          ) : null}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 20,
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: label ? 'var(--space-1)' : 0,
          background: 'var(--surface-edge)',
        }}
      >
        {composition.total > 0 &&
          segments.map((s) => (
            <div
              key={s.key}
              style={{
                width: `${s.pct}%`,
                background: s.fill,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {s.pct >= INLINE_LABEL_THRESHOLD && (
                <span
                  style={{
                    font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)',
                    color: s.ink,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {segmentLabel(s.pct)}
                </span>
              )}
            </div>
          ))}
      </div>
      {overflow.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
          {/* --space-1, not a raw 2 — Design System owner ruling, 26 Aug
              2026: 2 canvas is 1.5 rendered, which rounds unpredictably
              across browsers' subpixel handling; --space-1 (4 canvas / 3
              rendered) is deterministic and still tight enough to read
              as grouped with the bar above it. */}
          {overflow.map((s) => (
            <span
              key={s.key}
              style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}
            >
              {s.key[0]!.toUpperCase() + s.key.slice(1)} {segmentLabel(s.pct)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
