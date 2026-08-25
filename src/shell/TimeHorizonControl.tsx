import type { Horizon } from '../data/types.ts';
import { useContextHorizon } from './SessionStateProvider.tsx';

const HORIZONS: readonly { id: Horizon; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

export function TimeHorizonControl(): JSX.Element {
  const [horizon, setHorizon] = useContextHorizon();

  return (
    <div role="radiogroup" aria-label="Time Horizon" style={{ display: 'flex', gap: 'var(--space-2)' }}>
      {HORIZONS.map((h) => (
        <button
          key={h.id}
          type="button"
          role="radio"
          aria-checked={horizon === h.id}
          onClick={() => setHorizon(h.id)}
          style={{
            font: 'var(--weight-medium) var(--type-legend) / var(--leading-tight) var(--font-family)',
            color: horizon === h.id ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
            background: horizon === h.id ? 'var(--surface)' : 'transparent',
            border: `1px solid ${horizon === h.id ? 'var(--surface-edge)' : 'transparent'}`,
            borderRadius: 4,
            padding: '4px 10px',
            cursor: 'pointer',
          }}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}
