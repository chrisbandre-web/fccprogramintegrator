import type { Composition } from './selectors.ts';

// TAD §D.6.6 (revised 27 Aug 2026, Coordinator ruling) — a pure graphic:
// one 100% stacked bar of High / Medium / Low with High anchored at the
// left edge, so every High segment starts at the same point and is
// comparable down the column. No click handler, no text, no label prop.
// Interaction and labelling both moved to SegmentPills, which now sits
// above the bar wherever the bar is interactive — this component just
// renders the shape SegmentPills' values describe. Built from flex
// children with percentage widths — there is no chart library (§F.23).
//
// This used to carry its own click handler, its own inline/stacked-label
// split (INLINE_LABEL_THRESHOLD), and satisfy Rule E (Touch Two
// Amendment 1 §3) directly. All of that is gone: Rule E is now satisfied
// by SegmentPills instead (every segment's value is a real, always-
// present pill label, not text drawn conditionally on the bar), and a
// narrow segment no longer needs special handling here since nothing is
// ever rendered inside it.
export function CompositionBar({ composition }: { composition: Composition }): JSX.Element {
  const segments: readonly { key: 'high' | 'medium' | 'low'; pct: number; fill: string }[] = [
    { key: 'high', pct: composition.high, fill: 'var(--risk-bar-high)' },
    { key: 'medium', pct: composition.medium, fill: 'var(--risk-bar-medium)' },
    { key: 'low', pct: composition.low, fill: 'var(--risk-bar-low)' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: 'var(--comparison-bar-height)',
        borderRadius: 2,
        overflow: 'hidden',
        background: 'var(--surface-edge)',
      }}
    >
      {composition.total > 0 &&
        segments.map((s) => <div key={s.key} style={{ width: `${s.pct}%`, background: s.fill }} />)}
    </div>
  );
}
