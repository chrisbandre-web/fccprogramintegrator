import type { Composition } from './selectors.ts';

// TAD §D.6.6 — one 100% stacked composition of High / Medium / Low with
// High anchored at the left edge, so every High segment starts at the
// same point and is comparable down the column. Built from flex children
// with percentage widths — there is no chart library (§F.23). Labels are
// always present (Rule E — colour is never alone).
export function CompositionBar({
  label,
  composition,
  selected,
  onSelect,
  disabled = false,
}: {
  label: string;
  composition: Composition;
  selected: boolean;
  onSelect?: () => void;
  disabled?: boolean;
}): JSX.Element {
  const interactive = !disabled && !!onSelect;

  return (
    <button
      type="button"
      onClick={interactive ? onSelect : undefined}
      disabled={!interactive}
      aria-pressed={interactive ? selected : undefined}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: interactive ? 'pointer' : 'default',
        font: 'inherit',
        color: 'inherit',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          // TAD §D.6.5, Design System spec §8.3 — the selected state must
          // be readable without motion (prefers-reduced-motion loses the
          // collapse animation): weight, a left rule, and a position
          // marker, all three independent of any transition.
          borderLeft: selected ? '3px solid var(--ink-primary)' : '3px solid transparent',
          paddingLeft: 'var(--space-2)',
        }}
      >
        <span
          style={{
            font: `var(${selected ? '--weight-semibold' : '--weight-regular'}) var(--type-legend) / var(--leading-tight) var(--font-family)`,
            color: 'var(--ink-secondary)',
          }}
        >
          {selected && <span aria-hidden="true">▸ </span>}
          {label}
        </span>
        {composition.total === 0 ? (
          <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
            no records
          </span>
        ) : null}
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 20,
          borderRadius: 2,
          overflow: 'hidden',
          marginTop: 'var(--space-1)',
          background: 'var(--surface-edge)',
        }}
      >
        {composition.total > 0 && (
          <>
            <div style={{ width: `${composition.high}%`, background: 'var(--risk-bar-high)' }} />
            <div style={{ width: `${composition.medium}%`, background: 'var(--risk-bar-medium)' }} />
            <div style={{ width: `${composition.low}%`, background: 'var(--risk-bar-low)' }} />
          </>
        )}
      </div>
    </button>
  );
}
