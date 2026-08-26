import type { Rating } from '../../data/types.ts';
import type { KycAction, KycState } from './moduleState.ts';

const OPTIONS: readonly (Rating | 'All')[] = ['All', 'Low', 'Medium', 'High'];

// TAD §D.6.10 — All / Low / Medium / High, defaulting to High
// (KycState's own default, moduleState.ts). Module-owned via
// useModuleSession, so the filter persists across line changes, closing
// and reopening the panel, and leaving and re-entering the module —
// already true here because it's the same state object the whole module
// shares, not a separate piece of local state. Dispatching setRating
// resets page (the reducer's own invariant, moduleState.ts).
export function RatingFilter({ state, dispatch }: { state: KycState; dispatch: (action: KycAction) => void }): JSX.Element {
  return (
    <div role="radiogroup" aria-label="Rating filter" style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {OPTIONS.map((option) => {
        const selected = state.rating === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => dispatch({ type: 'setRating', rating: option })}
            style={{
              font: `var(${selected ? '--weight-semibold' : '--weight-regular'}) var(--type-legend) / var(--leading-tight) var(--font-family)`,
              color: selected ? 'var(--ink-primary)' : 'var(--ink-secondary)',
              background: selected ? 'var(--surface)' : 'transparent',
              border: `1px solid ${selected ? 'var(--surface-edge)' : 'transparent'}`,
              borderRadius: 4,
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
