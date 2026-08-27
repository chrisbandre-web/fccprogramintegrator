import type { Composition } from './selectors.ts';
import type { KycAction, KycState } from './moduleState.ts';
import type { BusinessLine, Rating } from '../../data/types.ts';

// TAD §D.6.6 (revised 27 Aug 2026, Coordinator ruling) — the pill row is
// the ONLY interactive and ONLY label-bearing surface for a composition;
// CompositionBar itself is a plain graphic, no click handler, no text.
// This is what makes narrow segments (a 1%-wide sliver is a few rendered
// pixels — not a reliable click target) as reachable as a 90%-wide one:
// every pill is a fixed-size, real <button>, regardless of what
// percentage it represents. Also what satisfies Rule E (Touch Two
// Amendment 1 §3 — a segment must carry its own value, not just a
// legend) now that the bar itself carries none: the pill IS the value.
//
// One line-name pill (rating: 'All', neutral styling) plus three rating
// pills (risk-coloured, matching CompositionBar's fills exactly so the
// pill row and the bar it sits above read as the same data). A
// radiogroup, not four independent buttons — selecting one line's rating
// is mutually exclusive within that row, same convention as
// RatingFilter and TimeHorizonControl elsewhere in this module/shell.
const RATING_FILL: Record<Rating, string> = {
  High: 'var(--risk-bar-high)',
  Medium: 'var(--risk-bar-medium)',
  Low: 'var(--risk-bar-low)',
};
const RATING_INK: Record<Rating, string> = {
  High: 'var(--surface)',
  Medium: 'var(--ink-primary)',
  Low: 'var(--ink-primary)',
};
const RATINGS: readonly Rating[] = ['High', 'Medium', 'Low'];

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

export function SegmentPills({
  groupLabel,
  line,
  composition,
  state,
  dispatch,
}: {
  groupLabel: string;
  line: 'book' | BusinessLine;
  composition: Composition;
  state: KycState;
  dispatch: (action: KycAction) => void;
}): JSX.Element {
  const select = (rating: Rating | 'All') => dispatch({ type: 'selectSegment', line, rating });

  if (composition.total === 0) {
    return (
      <span style={{ font: 'var(--weight-regular) var(--type-composition-label) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
        no records
      </span>
    );
  }

  return (
    <div role="radiogroup" aria-label={`${groupLabel} rating`} style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {(() => {
        const selected = state.selectedLine === line && state.rating === 'All';
        return (
          <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => select('All')}
            style={{
              font: `var(${selected ? '--weight-semibold' : '--weight-regular'}) var(--type-composition-label) / var(--leading-tight) var(--font-family)`,
              color: selected ? 'var(--ink-primary)' : 'var(--ink-secondary)',
              background: 'var(--surface)',
              border: '1px solid var(--surface-edge)',
              /* Selected-state ring sits OUTSIDE the pill (outline, not
                 border) deliberately — it renders against the page
                 background, never the pill's own fill, so the same rule
                 reads correctly whether the pill under it is light
                 (this one) or dark (the High rating pill below). A
                 border-colour approach would need per-pill contrast
                 logic; this doesn't. */
              outline: selected ? '2px solid var(--ink-primary)' : 'none',
              outlineOffset: 'var(--focus-ring-offset)',
              borderRadius: 4,
              padding: '2px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {groupLabel}
          </button>
        );
      })()}
      {RATINGS.map((rating) => {
        const value = rating === 'High' ? composition.high : rating === 'Medium' ? composition.medium : composition.low;
        const selected = state.selectedLine === line && state.rating === rating;
        return (
          <button
            key={rating}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => select(rating)}
            style={{
              font: `var(${selected ? '--weight-semibold' : '--weight-regular'}) var(--type-composition-label) / var(--leading-tight) var(--font-family)`,
              color: RATING_INK[rating],
              background: RATING_FILL[rating],
              border: 'none',
              outline: selected ? '2px solid var(--ink-primary)' : 'none',
              outlineOffset: 'var(--focus-ring-offset)',
              borderRadius: 4,
              padding: '2px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {rating} {pct(value)}
          </button>
        );
      })}
    </div>
  );
}
