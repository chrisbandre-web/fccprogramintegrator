import { RECORDS_PAGE_SIZE } from './selectors.ts';
import type { KycAction } from './moduleState.ts';

// TAD §D.6.11 — present only when total exceeds 25 (RECORDS_PAGE_SIZE),
// absent otherwise, so the signature view (Commercial / High / Month,
// ~20 records) is one clean page with no controls at the moment they
// would most distract. A quiet prompt appears once the list runs past a
// handful of pages — narrowing the rating filter or the horizon is
// almost always the faster path than clicking through many pages of an
// eleven-column table.
const MANY_PAGES_THRESHOLD = 10;

export function Pagination({
  total,
  page,
  dispatch,
}: {
  total: number;
  page: number;
  dispatch: (action: KycAction) => void;
}): JSX.Element | null {
  if (total <= RECORDS_PAGE_SIZE) return null;

  const totalPages = Math.ceil(total / RECORDS_PAGE_SIZE);
  const start = (page - 1) * RECORDS_PAGE_SIZE + 1;
  const end = Math.min(page * RECORDS_PAGE_SIZE, total);
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const labelStyle = {
    font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)',
    color: 'var(--ink-tertiary)',
  } as const;

  const buttonStyle = (disabled: boolean) =>
    ({
      font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)',
      color: disabled ? 'var(--ink-tertiary)' : 'var(--accent)',
      background: 'transparent',
      border: 'none',
      padding: '4px 8px',
      cursor: disabled ? 'default' : 'pointer',
    }) as const;

  return (
    <div
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--surface-edge)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          type="button"
          disabled={isFirst}
          onClick={() => dispatch({ type: 'setPage', page: 1 })}
          style={buttonStyle(isFirst)}
        >
          First
        </button>
        <button
          type="button"
          disabled={isFirst}
          onClick={() => dispatch({ type: 'setPage', page: page - 1 })}
          style={buttonStyle(isFirst)}
        >
          Previous
        </button>
        <span style={labelStyle}>
          Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
        </span>
        <button
          type="button"
          disabled={isLast}
          onClick={() => dispatch({ type: 'setPage', page: page + 1 })}
          style={buttonStyle(isLast)}
        >
          Next
        </button>
        <button
          type="button"
          disabled={isLast}
          onClick={() => dispatch({ type: 'setPage', page: totalPages })}
          style={buttonStyle(isLast)}
        >
          Last
        </button>
      </div>
      {totalPages > MANY_PAGES_THRESHOLD && (
        <span style={labelStyle}>{totalPages.toLocaleString()} pages — the rating filter or a shorter horizon will narrow this.</span>
      )}
    </div>
  );
}
