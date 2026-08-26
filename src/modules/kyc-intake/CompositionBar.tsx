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
// it's wide enough to hold the type at --type-composition-label's
// rendered size; otherwise the value moves adjacent to the bar rather
// than being dropped. Label ink per fcc-tokens.css §6: --ink-primary on
// low and medium, --surface (light on dark) on high.
//
// --type-composition-label, not --type-legend (Design System owner
// ruling, 26 Aug 2026, v1.3): these values are DATA, not chrome -- they
// are what makes this encoding label-bearing under Rule E -- so they are
// sized one step above the legend floor, deliberately as their own named
// token rather than reusing --type-body (same value, different job;
// coupling them would let an About-copy change silently resize chart
// labels). The bar's own height moved from 20 to --comparison-bar-height
// (24px) in the same amendment, coupled to this: an 18px label has a
// 13.1 canvas cap height, and a 20px bar left only 2.6 rendered px of
// clearance -- 24 gives 4.1.
//
// The inline/stacked threshold below is a PERCENTAGE OF BAR WIDTH, not a
// pixel measurement -- it works today because the bar's own width is
// fixed by the field it lives in (Design System owner note, 26 Aug
// 2026). If that field's width ever becomes variable, this threshold
// must be re-derived from pixels against the label's actual rendered
// width, not carried forward as the same percentage.
//
// Threshold recalibrated 8 -> 9 alongside the type bump (roughly
// proportional to the ~12.5% size increase). This is a calculated
// estimate, not a visually confirmed one -- per the Design System
// owner's own instruction, the real number should be verified against
// the deployed build at magnification, not computed in the abstract,
// and that verification is still outstanding as of this commit.
//
// Separately, nothing narrower than the threshold can produce a label
// wider than "XX%" regardless of where the threshold sits:
// segmentLabel() rounds the same value that determines the segment's own
// width, so a segment near the 9% threshold can only ever show a
// percentage near 9 -- a four-character value ("100%") requires the
// segment to itself be ~100% wide, nowhere near this boundary.
const INLINE_LABEL_THRESHOLD = 9;

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
          height: 'var(--comparison-bar-height)',
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
                    font: 'var(--weight-semibold) var(--type-composition-label) / var(--leading-tight) var(--font-family)',
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
              style={{ font: 'var(--weight-regular) var(--type-composition-label) / var(--leading-tight) var(--font-family)', color: 'var(--ink-secondary)' }}
            >
              {/* --ink-secondary, not --ink-tertiary. The Design System
                  owner asked for the Engineer's read here rather than
                  guess from a screenshot ("I'll take your read over my
                  guess") -- this is that read, not yet their own
                  confirmation: these are the same data values as the
                  inline labels, just narrow enough to need the stacked
                  treatment, so they should read as data
                  (--ink-secondary) rather than caption chrome. Weight is
                  unchanged (--weight-regular) alongside the size bump,
                  so this isn't stacking two emphasis changes at once.
                  Flagged back for their actual confirmation once
                  deployed. */}
              {s.key[0]!.toUpperCase() + s.key.slice(1)} {segmentLabel(s.pct)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
