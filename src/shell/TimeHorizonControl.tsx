import type { Horizon } from '../data/types.ts';
import { useContextHorizon } from './SessionStateProvider.tsx';

// TouchTwo Amendment 2 §2 — vertical stack, shortest to longest by label
// length (Year 4 · Month 5 · Quarter 7), centred as a block within the
// frame, left-aligned internally. Larger than every other frame control
// (--type-horizon-value, 24 canvas) — the only control a viewer operates
// during the demo.
const HORIZONS: readonly { id: Horizon; label: string }[] = [
  { id: 'year', label: 'Year' },
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
];

export function TimeHorizonControl(): JSX.Element {
  const [horizon, setHorizon] = useContextHorizon();

  return (
    <div role="radiogroup" aria-label="Time Horizon" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--horizon-value-gap)', alignItems: 'flex-start' }}>
        {HORIZONS.map((h) => {
          const selected = horizon === h.id;
          return (
            <button
              key={h.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-selected={selected}
              className="horizon-value"
              onClick={() => setHorizon(h.id)}
            >
              {/* The rule's space is ALWAYS reserved (TouchTwo Amendment 2
                  §2.2) — present, transparent, on every value, not just the
                  selected one. Rendering it only when selected would shift
                  the text horizontally on every click. */}
              <span className="horizon-value__rule" />
              {h.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
