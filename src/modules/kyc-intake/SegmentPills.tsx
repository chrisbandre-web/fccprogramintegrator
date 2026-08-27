import type { Composition } from './selectors.ts';
import type { KycAction, KycState } from './moduleState.ts';
import type { BusinessLine, Rating } from '../../data/types.ts';

// TAD §D.6.12 (v1.4, Design System owner ruling, 27 Aug 2026) — Rule B
// applied to a control: the pill surface stays neutral and colour is a
// bounded mark, exactly as the board's 26 elements already work.
//
// Selection has TWO SEPARATE signals, not one shared between them:
//
//   RATING selection (this component): fill vs. outline. A solid pill
//   against outlined pills is a FORM difference, not a colour one — it
//   survives full desaturation (verified in greyscale, 27 Aug 2026), so
//   it's already non-colour and already greyscale-safe on its own.
//   REGULAR weight throughout. Do NOT reinstate bold as an accessibility
//   measure here — it never was one. Fill alone is what's carrying the
//   signal; bold was redundant with it, not reinforcing it. A future
//   reviewer seeing white-on-oxblood at regular weight may read "colour
//   selection with no redundancy" and want to add bold back — that
//   reasoning doesn't hold. Text ink on a selected pill is Touch Two
//   Amendment 1 §3's segment-label rule, reused verbatim: --surface on
//   High (7.84:1 — the same ratio as --risk-text-high on --surface,
//   since it's the same pair of colours with foreground and background
//   swapped), --ink-primary on Medium and Low.
//
//   LINE selection: the leading rule on the whole row, in Comparison.tsx
//   (§D.6.5) — NOT owned by this component, and NOT affected by which
//   rating is currently selected within a line. An earlier version of
//   this component duplicated a leading-rule effect per pill, which was
//   wrong on two counts: it conflated a line-level signal with a
//   rating-level one, and it duplicated a marker Comparison.tsx already
//   drew correctly one level up.
//
// The unselected line-name pill ("All") gets the same fill-vs-outline
// treatment when selected, for consistency with the rating pills' rule
// — a neutral fill (--ink-primary) rather than a --risk-bar-* one, since
// "All" has no associated risk colour. Not something the Design System
// owner's ruling addressed directly (their note is about the rating
// pills specifically); this is the Engineer's direct extension of the
// same stated principle to the one pill type it didn't cover, not a
// separate decision.
//
// The tinted-field approach (each pill filled with a lightened mix of
// its own --risk-bar-* value) was tried and rejected before this —
// --risk-bar-low's source saturation (0.09) leaves nothing to dilute,
// and its hue angle goes numerically meaningless well before any usable
// tint ratio. No single ratio held for all three. See TAD.md §L.1 for
// the numbers.
const RATING_FILL: Record<Rating, string> = {
  High: 'var(--risk-bar-high)',
  Medium: 'var(--risk-bar-medium)',
  Low: 'var(--risk-bar-low)',
};
// Selected-state ink only — Touch Two Amendment 1 §3's rule, reused
// verbatim rather than re-specified.
const SELECTED_INK: Record<Rating, string> = {
  High: 'var(--surface)',
  Medium: 'var(--ink-primary)',
  Low: 'var(--ink-primary)',
};
const RATINGS: readonly Rating[] = ['High', 'Medium', 'Low'];

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

function Swatch({ fill }: { fill: string }): JSX.Element {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 'var(--pill-swatch-size)',
        height: 'var(--pill-swatch-size)',
        background: fill,
        flexShrink: 0,
      }}
    />
  );
}

const PILL_BASE = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  font: 'var(--weight-regular) var(--type-composition-label) / var(--leading-tight) var(--font-family)',
  borderRadius: 4,
  padding: '2px 10px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const;

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
              ...PILL_BASE,
              color: selected ? 'var(--surface)' : 'var(--ink-primary)',
              background: selected ? 'var(--ink-primary)' : 'var(--surface)',
              border: selected ? '1px solid transparent' : 'var(--pill-keyline) solid var(--surface-edge)',
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
              ...PILL_BASE,
              color: selected ? SELECTED_INK[rating] : 'var(--ink-primary)',
              background: selected ? RATING_FILL[rating] : 'var(--surface)',
              border: selected ? '1px solid transparent' : 'var(--pill-keyline) solid var(--surface-edge)',
            }}
          >
            {/* Swatch omitted when selected — "the fill states it"
                (Design System owner, v1.4). Shown unconditionally
                otherwise, full-strength --risk-bar-*, regardless of how
                narrow the segment it represents is. */}
            {!selected && <Swatch fill={RATING_FILL[rating]} />}
            {rating} {pct(value)}
          </button>
        );
      })}
    </div>
  );
}
