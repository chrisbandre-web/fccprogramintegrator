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

// "Book" only, now — Coordinator direction, 27 Aug 2026: no separate
// "Recent intake" caption any more (the pill row above that bar already
// names the line and doubles as its header — a second, redundant label
// would repeat what the pills already say). Book still needs a plain
// label; it has no pills of its own to speak for it. Bumped to 18px to
// match the pill row's own size (--type-composition-label), per the same
// direction.
function BookCaption(): JSX.Element {
  return (
    <span style={{ font: 'var(--weight-regular) 18px / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
      Book
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
 * Revised again 27 Aug 2026 (Coordinator direction, feasibility discussed
 * first): recent intake now renders ABOVE book, not below — recent to
 * historical, and it means the row that survives collapse (recent
 * intake) is already the one sitting first when expanded, rather than
 * swapping position on collapse. The pill row above it is deliberately
 * the section's only header — "each section starts with a pill line
 * declaring what that section represents" — not a separate title, which
 * would just repeat the line name the line-name pill already carries.
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <SegmentPills groupLabel={groupLabel} line={line} composition={recent} state={state} dispatch={dispatch} />
          <CompositionBar composition={recent} />
        </div>
        {book && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            {interactiveBook ? (
              <SegmentPills groupLabel={groupLabel} line={line} composition={book} state={state} dispatch={dispatch} />
            ) : (
              <BookCaption />
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
// justify-content: space-between on the groups wrapper (added 27 Aug
// 2026, Coordinator direction), not a hardcoded gap — deliberately.
// C1's UAT note and this component's own unused vertical space are the
// same fact: at full height, four sections' worth of fixed content
// (computed: ~456 canvas across Whole Book's two-pill-row structure and
// three symmetric line sections) leaves roughly 448 canvas of real
// slack in a 1016-canvas-tall module area, once Comparison's own
// padding, its gap before MethodologyLabel, and MethodologyLabel's own
// two lines are accounted for — about 149 canvas per boundary, worked
// from the canvas's known fixed dimensions rather than guessed. A
// hardcoded 149px would be correct only for exactly this combination of
// font sizes and padding, and would silently drift the next time any of
// those change; space-between recomputes the same answer automatically,
// which is why it's used here instead of the number itself. Requires
// the wrapper to actually stretch to fill its share of the available
// height (flex: 1 below, plus height: 100% on this component's own
// root) — without that, flexbox has no slack to distribute and
// space-between does nothing, which was the actual mechanism behind
// C1's "lots of padding at the bottom": this content never stretched to
// fill the height its parent had already allocated to it.
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
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
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
