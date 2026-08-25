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
export function CompositionBar({ label, composition }: { label: string; composition: Composition }): JSX.Element {
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
        {composition.total > 0 && (
          <>
            <div style={{ width: `${composition.high}%`, background: 'var(--risk-bar-high)' }} />
            <div style={{ width: `${composition.medium}%`, background: 'var(--risk-bar-medium)' }} />
            <div style={{ width: `${composition.low}%`, background: 'var(--risk-bar-low)' }} />
          </>
        )}
      </div>
    </div>
  );
}
