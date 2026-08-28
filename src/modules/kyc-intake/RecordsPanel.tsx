import type { BusinessLine } from '../../data/types.ts';
import { useDataAccess } from '../../shell/DataAccessProvider.tsx';
import { useContextHorizon } from '../../shell/SessionStateProvider.tsx';
import { RecordTable } from './RecordTable.tsx';
import { RatingFilter } from './RatingFilter.tsx';
import { Pagination } from './Pagination.tsx';
import { populationCount, recordPage } from './selectors.ts';
import type { KycAction, KycState } from './moduleState.ts';
import { MODULE_ID } from './moduleId.ts';

const LINE_LABELS: Record<'book' | BusinessLine, string> = {
  book: 'the whole book',
  'retail-consumer': 'Retail',
  commercial: 'Commercial',
  'asset-management': 'Asset Management',
};

// TAD §D.6.8 (closes A21) — the module's lower region, present iff a
// line is selected (CustomerIntakeModule.tsx's own conditional). Four
// record states live here: populated, sparse, paginated, empty-for-
// filter. Sparse is not a fifth visual treatment — it's the same table
// with a count header that says "1 of 146," which explains the smallness
// on its own (§D.6.8: "there is no 'not much here' treatment"). Empty-
// for-filter (a rating filter with zero matches) is the one state that
// genuinely can't reuse the table, since a table with headers and no
// rows reads as broken rather than as a real answer.
export function RecordsPanel({
  state,
  dispatch,
  selectedLine,
}: {
  state: KycState;
  dispatch: (action: KycAction) => void;
  selectedLine: 'book' | BusinessLine;
}): JSX.Element {
  const data = useDataAccess();
  const [horizon] = useContextHorizon(MODULE_ID);

  const total = populationCount(data, selectedLine, horizon);
  const page = recordPage(data, selectedLine, state.rating, horizon, state.page);
  const lineLabel = LINE_LABELS[selectedLine];

  const headerText =
    state.rating === 'All'
      ? `${page.total.toLocaleString()} records for ${lineLabel}`
      : `${page.total.toLocaleString()} ${state.rating}-rated of ${total.toLocaleString()} onboarded, ${lineLabel}`;

  return (
    <div className="records-reveal" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-3) var(--space-4)',
          borderBottom: '1px solid var(--surface-edge)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-4)' }}>
          <span style={{ font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-primary)' }}>
            {headerText}
          </span>
          <RatingFilter state={state} dispatch={dispatch} />
        </div>
        {/* Deselecting, closing, and re-expanding the Comparison are one
            action (§D.6.5/§D.6.8) — dispatching deselect is enough; the
            Comparison's own collapsed !== null check does the rest. */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'deselect' })}
          style={{
            font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)',
            color: 'var(--accent)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Close
        </button>
      </div>

      {/* TAD §I.1/§D.6.9 say "the table is not a scroll region" in the
          keyboard/tab-order sense — a scrollable div can silently become
          an undocumented Tab stop, which the focus-order audit (§I.1)
          never accounted for. tabIndex={-1} keeps that true: this
          container is removed from the tab sequence, so it can't be
          reached or landed on by keyboard navigation. overflow was
          'hidden', not 'auto' — that's a different thing entirely, and a
          real bug: UAT (27 Aug 2026, C4) found records genuinely
          unreachable, clipped below the visible area with no way to see
          them, even though the header correctly reported a larger count
          (21 of 40) than what was showing (11 rows). 'hidden' discards
          the overflow instead of making it reachable; 'auto' (mouse/
          trackpad-scrollable, keyboard-inert via tabIndex) fixes the
          real defect without reopening the tab-order question.

          minHeight: 0 was still missing after that first fix, and UAT
          confirmed the cut-off persisted (27 Aug 2026, second pass) --
          the classic flexbox trap: a flex child's default min-height is
          auto, which means it refuses to shrink below its OWN content's
          height even inside a flex:1 parent. Without this, the div grows
          to fit the full table instead of being constrained to its
          allotted space, so overflow: auto never had anything to do —
          the content just pushed past this element's boundary and got
          clipped by whatever ancestor happened to have no scroll
          mechanism of its own (the fixed-size canvas), nowhere near this
          div's own edge. Same trap exists one level up the tree; see
          CustomerIntakeModule.tsx's matching fix. */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-4)' }} tabIndex={-1}>
        {page.total === 0 ? (
          <p style={{ color: 'var(--ink-tertiary)', font: 'var(--weight-regular) var(--type-body) / var(--leading-body) var(--font-family)' }}>
            No {state.rating === 'All' ? '' : `${state.rating}-rated `}records for {lineLabel} at this horizon.
          </p>
        ) : (
          <RecordTable records={page.records} />
        )}
      </div>

      <Pagination total={page.total} page={state.page} dispatch={dispatch} />
    </div>
  );
}
