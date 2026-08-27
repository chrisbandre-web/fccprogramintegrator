import { useDataAccess } from '../../shell/DataAccessProvider.tsx';
import { useContextHorizon } from '../../shell/SessionStateProvider.tsx';
import { CompositionBar } from './CompositionBar.tsx';
import { SegmentPills } from './SegmentPills.tsx';
import { MethodologyLabel } from './MethodologyLabel.tsx';
import { bookComposition, intakeComposition, type Composition } from './selectors.ts';
import type { KycAction, KycState } from './moduleState.ts';
import type { RegulatoryAlignment } from '../../declarations/types.ts';
import type { BusinessLine } from '../../data/types.ts';

const LINES: readonly { id: BusinessLine; label: string }[] = [
  { id: 'retail-consumer', label: 'Retail' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'asset-management', label: 'Asset Management' },
];

// A small plain-text row caption — "Book" / "Recent intake" — distinguishing
// which population a bar shows. Not the line's identity any more (the
// SegmentPills line-name pill carries that); just which of the two rows
// this is, for groups that show both.
function RowCaption({ children }: { children: string }): JSX.Element {
  return (
    <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
      {children}
    </span>
  );
}

/**
 * One selectable group. TAD §D.6.5 revised 27 Aug 2026 (Coordinator
 * ruling): selection used to be per LINE, via one click handler wrapping
 * the whole group. It is now per SEGMENT, via SegmentPills sitting above
 * whichever bar is interactive — CompositionBar itself carries no click
 * handler at all any more (§D.6.6). This component now only lays bars
 * and pill rows out; it owns no interaction directly.
 *
 * Whole Book keeps both rows interactive (its own two pill rows, book
 * and recent intake) per the Coordinator's ruling — both currently
 * dispatch the same (line: 'book', rating) action and so resolve to the
 * same population query (§D.6.4's bookComposition is horizon-independent
 * either way this is reached), preserving the pre-existing, documented
 * Whole Book asymmetry rather than resolving it. A business line's Book
 * row is display-only: no pills, no interaction — its Records query was
 * always population 'intake' at the current horizon regardless of which
 * of its two bars was clicked (baseQueryFor, selectors.ts), so a second,
 * always-redundant interactive row would have been a control that never
 * did anything different from its neighbour.
 */
function ComparisonGroup({
  groupLabel,
  line,
  book,
  recent,
  collapsed,
  selected,
  interactiveBook,
  state,
  dispatch,
}: {
  groupLabel: string;
  line: 'book' | BusinessLine;
  book: Composition | null; // null when collapsed — the book row drops out (§D.6.5's Implementation Note)
  recent: Composition;
  collapsed: boolean;
  selected: boolean;
  interactiveBook: boolean; // true only for Whole Book — a line's Book row is display-only
  state: KycState;
  dispatch: (action: KycAction) => void;
}): JSX.Element {
  return (
    <div
      style={{
        borderLeft: selected ? '3px solid var(--ink-primary)' : '3px solid transparent',
        paddingLeft: 'var(--space-2)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {book && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <RowCaption>Book</RowCaption>
            {interactiveBook ? (
              <SegmentPills groupLabel={groupLabel} line={line} composition={book} state={state} dispatch={dispatch} />
            ) : null}
            <CompositionBar composition={book} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          {/* Collapsed: no caption — the pill row's own line-name pill
              already names it, and there's no second bar left to
              disambiguate against. Full height: always "Recent intake",
              paired with "Book" above. */}
          {!collapsed && <RowCaption>Recent intake</RowCaption>}
          <SegmentPills groupLabel={groupLabel} line={line} composition={recent} state={state} dispatch={dispatch} />
          <CompositionBar composition={recent} />
        </div>
      </div>
    </div>
  );
}

// TAD §D.6.5 (closes A18, part) — eight bars in four pairs at full
// height (the whole book, then each business line, book above / recent
// intake below); four bars collapsed (the whole-book GROUP persists as
// a row — unlike the per-line book bars, which drop out — but its
// MEASURE does not change: every collapsed bar shows Recent intake, so
// the four collapsed bars are directly comparable). The collapse
// changes what's displayed, not merely its size — a content transition,
// not a CSS one (§D.6.5's Implementation Note).
export function Comparison({
  state,
  dispatch,
  alignment,
}: {
  state: KycState;
  dispatch: (action: KycAction) => void;
  alignment: RegulatoryAlignment | undefined;
}): JSX.Element {
  const data = useDataAccess();
  const [horizon] = useContextHorizon('kyc-intake');

  const collapsed = state.selectedLine !== null;

  const wholeBook = bookComposition(data);
  const wholeRecent = intakeComposition(data, horizon);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <ComparisonGroup
          groupLabel="Whole Book"
          line="book"
          book={collapsed ? null : wholeBook}
          recent={wholeRecent}
          collapsed={collapsed}
          selected={state.selectedLine === 'book'}
          interactiveBook={true}
          state={state}
          dispatch={dispatch}
        />
        {LINES.map((line) => (
          <ComparisonGroup
            key={line.id}
            groupLabel={line.label}
            line={line.id}
            book={collapsed ? null : bookComposition(data, line.id)}
            recent={intakeComposition(data, horizon, line.id)}
            collapsed={collapsed}
            selected={state.selectedLine === line.id}
            interactiveBook={false}
            state={state}
            dispatch={dispatch}
          />
        ))}
      </div>

      <MethodologyLabel alignment={alignment} />
    </div>
  );
}
