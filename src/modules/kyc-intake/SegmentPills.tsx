import type { Composition } from './selectors.ts';
import type { KycAction, KycState } from './moduleState.ts';
import type { BusinessLine, Rating } from '../../data/types.ts';

// TAD §D.6.12 (revised 27 Aug 2026, Design System owner ruling, v1.4) —
// "a neutral control carrying a bounded colour mark, not a tinted
// field." Replaces the first cut of this component, which filled every
// pill with its own --risk-bar-* at full strength regardless of
// selection state — visually competed with the bar and, when a tint was
// tried instead to quiet it, broke down entirely for Low (source
// saturation 0.09; there's nothing left to dilute, and its hue angle
// goes numerically meaningless well before any useful tint ratio).
//
// This is Rule B from Touch One, unchanged, applied here rather than
// invented new: RAG is a mark, not a field. Every one of the 26 board
// elements already teaches the viewer this pattern before they reach
// the Comparison.
//
//   Unselected: --surface fill, 1px --surface-edge keyline,
//     --ink-primary text, a small square swatch in the leading position
//     at the segment's own --risk-bar-* value, full strength.
//   Selected: fills with its own --risk-bar-* at full strength,
//     semibold weight, a leading rule -- three signals, so selection is
//     never colour alone. Selected-state ink reuses Touch Two Amendment
//     1's segment-label rule verbatim (--surface on high, --ink-primary
//     on medium/low) rather than inventing a second rule for the same
//     colours.
//
// The Low swatch sits at 1.74:1 against --surface -- below the
// graphical floor, and accepted as such: it's the same value already
// specified for the MarkLegend swatches (Touch Two Amendment 2), and
// Rule E is satisfied by the word "Low" beside it, not by the swatch's
// own contrast. The swatch reinforces; the label carries.
const RATING_FILL: Record<Rating, string> = {
  High: 'var(--risk-bar-high)',
  Medium: 'var(--risk-bar-medium)',
  Low: 'var(--risk-bar-low)',
};
// Selected-state ink only -- Touch Two Amendment 1 §3's rule, reused
// verbatim rather than re-specified.
const SELECTED_INK: Record<Rating, string> = {
  High: 'var(--surface)',
  Medium: 'var(--ink-primary)',
  Low: 'var(--ink-primary)',
};
const RATINGS: readonly Rating[] = ['High', 'Medium', 'Low'];

// PROVISIONAL, not yet a token -- the Design System owner asked to
// confirm this against the rendered build rather than issue it from
// arithmetic ("I'd rather confirm the swatch size against the rendered
// thing than assert 12px from arithmetic"). Carried at 12 canvas here,
// same convention as --register-title-width's own provisional period
// (§L.1, §F.10) -- requested as a Touch Two v1.4 addition once a
// magnified screenshot confirms it.
const SWATCH_SIZE = 12;

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

function Swatch({ fill }: { fill: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: SWATCH_SIZE,
        height: SWATCH_SIZE,
        background: fill,
        flexShrink: 0,
      }}
    />
  );
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
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              font: `var(${selected ? '--weight-semibold' : '--weight-regular'}) var(--type-composition-label) / var(--leading-tight) var(--font-family)`,
              color: 'var(--ink-primary)',
              background: 'var(--surface)',
              border: '1px solid var(--surface-edge)',
              borderLeft: selected ? '3px solid var(--ink-primary)' : '1px solid var(--surface-edge)',
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
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              font: `var(${selected ? '--weight-semibold' : '--weight-regular'}) var(--type-composition-label) / var(--leading-tight) var(--font-family)`,
              color: selected ? SELECTED_INK[rating] : 'var(--ink-primary)',
              background: selected ? RATING_FILL[rating] : 'var(--surface)',
              border: selected ? '1px solid transparent' : '1px solid var(--surface-edge)',
              borderLeft: selected ? '3px solid var(--ink-primary)' : '1px solid var(--surface-edge)',
              borderRadius: 4,
              padding: '2px 10px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Swatch fill={RATING_FILL[rating]} />
            {rating} {pct(value)}
          </button>
        );
      })}
    </div>
  );
}
