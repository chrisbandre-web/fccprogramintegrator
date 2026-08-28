import { useDataAccess } from '../../shell/DataAccessProvider.tsx';
import { useContextHorizon } from '../../shell/SessionStateProvider.tsx';
import { CompositionBar } from './CompositionBar.tsx';
import { SegmentPills } from './SegmentPills.tsx';
import { MethodologyLabel } from './MethodologyLabel.tsx';
import { bookComposition, intakeComposition, type Composition } from './selectors.ts';
import type { KycAction, KycState } from './moduleState.ts';
import type { RegulatoryAlignment } from '../../declarations/types.ts';
import type { BusinessLine } from '../../data/types.ts';
import { MODULE_ID } from './moduleId.ts';

const LINES: readonly { id: BusinessLine; label: string }[] = [
  { id: 'retail-consumer', label: 'Retail' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'asset-management', label: 'Asset Management' },
];

// Revised again 28 Aug 2026 (Art Director note): a plain text caption on
// EVERY row, always — "Recent intake" above the upper bar, "Book" above
// the lower, on all four groups including Whole Book. The prior version
// let the pill row's line-name pill stand in as the "header" for recent
// intake and skipped a separate caption for it, on the reasoning that a
// second label would just repeat the line name. That reasoning solved
// the wrong problem: the pill's line name answers "which LINE", not
// "which of the two rows" — recent intake vs. book are two different
// facts, and only one of them (book) was actually being named. Worse for
// Whole Book specifically: since both its rows are interactive, both
// rendered a "Whole Book" pill, so the same name appeared twice with two
// different, seemingly contradictory sets of numbers. Signature moment
// two's entire argument is that recent intake differs from the
// established book — that comparison doesn't read if the two terms
// aren't both named. Whole Book's book row keeps its pills (still
// selectable, per the Coordinator's ruling that both of its rows stay
// interactive) but now captions them "Book" like every other line's
// book row, not "Whole Book" again — the caption was what was missing,
// not the interaction.
function RowCaption({ children }: { children: string }): JSX.Element {
  return (
    <span style={{ font: 'var(--weight-regular) 18px / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
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
 * Revised 27 Aug 2026 (Coordinator direction, feasibility discussed
 * first): recent intake now renders ABOVE book, not below — recent to
 * historical, and it means the row that survives collapse (recent
 * intake) is already the one sitting first when expanded, rather than
 * swapping position on collapse.
 *
 * Whole Book keeps both rows interactive (its own two pill rows, book
 * and recent intake) per the Coordinator's ruling — both currently
 * dispatch the same (line: 'book', rating) action and so resolve to the
 * same population query (§D.6.4's bookComposition is horizon-independent
 * either way this is reached), preserving the pre-existing, documented
 * Whole Book asymmetry rather than resolving it. A business line's Book
 * row has a caption but no pills — its Records query was always
 * population 'intake' at the current horizon regardless of which of its
 * two bars was clicked (baseQueryFor, selectors.ts), so a second,
 * always-redundant interactive row would have been a control that never
 * did anything different from its neighbour.
 */
function ComparisonGroup({
  groupLabel,
  line,
  book,
  recent,
  selected,
  interactiveBook,
  state,
  dispatch,
}: {
  groupLabel: string;
  line: 'book' | BusinessLine;
  book: Composition | null; // null when collapsed — the book row drops out (§D.6.5's Implementation Note)
  recent: Composition;
  selected: boolean;
  interactiveBook: boolean; // true only for Whole Book — a line's Book row has a caption, no pills
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <RowCaption>Recent intake</RowCaption>
          <SegmentPills groupLabel={groupLabel} line={line} composition={recent} state={state} dispatch={dispatch} />
          <CompositionBar composition={recent} />
        </div>
        {book && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <RowCaption>Book</RowCaption>
            {interactiveBook && (
              <SegmentPills groupLabel={groupLabel} line={line} composition={book} state={state} dispatch={dispatch} />
            )}
            <CompositionBar composition={book} />
          </div>
        )}
      </div>
    </div>
  );
}

// TAD §D.6.5 (closes A18, part) — eight bars in four pairs at full
// height (the whole book, then each business line, recent intake above /
// book below — reordered 27 Aug 2026, see ComparisonGroup); four bars
// collapsed (the whole-book GROUP persists as a row — unlike the
// per-line book bars, which drop out — but its MEASURE does not change:
// every collapsed bar shows Recent intake, so the four collapsed bars
// are directly comparable). The collapse changes what's displayed, not
// merely its size — a content transition, not a CSS one (§D.6.5's
// Implementation Note).
//
// justify-content: center on the groups wrapper (revised 27 Aug 2026,
// Coordinator direction, replacing the space-between tried a commit
// earlier), with a fixed --space-4 gap between sections rather than a
// computed one. space-between put ALL available slack into the
// inter-section gaps, which is wrong in both directions at once: too
// spread out in the expanded view (Coordinator's "more centered... push
// all four sections closer together"), and too little breathing room
// left in the collapsed view (~30% module height, far less slack to
// begin with — "a little on the cramped side"). center packs the four
// sections together at a modest, constant gap and puts whatever's left
// over as symmetric padding above and below the whole group instead of
// stretching it between items — which is the literal ask ("padding top
// and bottom to push all four sections closer together") and, as a
// side effect, is the safer choice for the collapsed state too:
// --space-4 is the same gap this layout used successfully before
// today's changes, so there's no new overflow risk in the tighter
// 30%-height case the way a freshly computed larger gap would have
// carried.
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
  const [horizon] = useContextHorizon(MODULE_ID);

  const collapsed = state.selectedLine !== null;

  const wholeBook = bookComposition(data);
  const wholeRecent = intakeComposition(data, horizon);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'var(--space-4)', flex: 1 }}>
        <ComparisonGroup
          groupLabel="Whole Book"
          line="book"
          book={collapsed ? null : wholeBook}
          recent={wholeRecent}
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
