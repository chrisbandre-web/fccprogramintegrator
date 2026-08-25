import { useDataAccess } from '../../shell/DataAccessProvider.tsx';
import { useContextHorizon } from '../../shell/SessionStateProvider.tsx';
import { CompositionBar } from './CompositionBar.tsx';
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

/**
 * One selectable group: at full height, a labelled pair (book above,
 * recent intake below); collapsed, a single bar. Wrapping the pair in one
 * clickable container — rather than making each bar independently
 * clickable — is what makes "click either bar in the row" and "the row
 * is one destination" the same fact (TAD §D.6.5: selection is per LINE,
 * not per bar).
 */
function ComparisonGroup({
  groupLabel,
  book,
  recent,
  collapsed,
  selected,
  onSelect,
}: {
  groupLabel: string;
  book: Composition | null; // null when collapsed — the book row drops out (§D.6.5's Implementation Note)
  recent: Composition;
  collapsed: boolean;
  selected: boolean;
  onSelect: () => void;
}): JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      style={{
        cursor: 'pointer',
        borderLeft: selected ? '3px solid var(--ink-primary)' : '3px solid transparent',
        paddingLeft: 'var(--space-2)',
      }}
    >
      <div style={{ font: `var(${selected ? '--weight-semibold' : '--weight-medium'}) var(--type-legend) / var(--leading-tight) var(--font-family)`, color: 'var(--ink-secondary)', marginBottom: 'var(--space-1)' }}>
        {selected && <span aria-hidden="true">▸ </span>}
        {groupLabel}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {book && <CompositionBar label="Book" composition={book} />}
        {/* Collapsed: one bar, no sub-label — the group heading above
            already names it (whole book, or the line). Full height: the
            recent-intake bar is always labelled explicitly, paired with
            the book bar above it. */}
        <CompositionBar label={collapsed ? '' : 'Recent intake'} composition={recent} />
      </div>
    </div>
  );
}

// TAD §D.6.5 (closes A18, part) — eight bars in four pairs at full
// height (the whole book, then each business line, book above / recent
// intake below); four bars collapsed (the whole-book anchor persists,
// the per-line book bars drop out). The collapse changes what's
// displayed, not merely its size — a content transition, not a CSS one
// (§D.6.5's Implementation Note).
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
  const selectLine = (line: 'book' | BusinessLine) => dispatch({ type: 'selectLine', line });

  const wholeBook = bookComposition(data);
  const wholeRecent = intakeComposition(data, horizon);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <ComparisonGroup
          groupLabel="Whole Book"
          book={collapsed ? null : wholeBook}
          // Collapsed, the whole-book row is the standing anchor — its
          // own book composition, not the intake aggregate (§D.6.5:
          // "the whole-book anchor persists in both states").
          recent={collapsed ? wholeBook : wholeRecent}
          collapsed={collapsed}
          selected={state.selectedLine === 'book'}
          onSelect={() => selectLine('book')}
        />
        {LINES.map((line) => (
          <ComparisonGroup
            key={line.id}
            groupLabel={line.label}
            book={collapsed ? null : bookComposition(data, line.id)}
            recent={intakeComposition(data, horizon, line.id)}
            collapsed={collapsed}
            selected={state.selectedLine === line.id}
            onSelect={() => selectLine(line.id)}
          />
        ))}
      </div>

      <MethodologyLabel alignment={alignment} />
    </div>
  );
}
