import type { Horizon } from '../data/types.ts';
import { useContextHorizon } from './SessionStateProvider.tsx';

// TouchTwo Amendment 2 §2 — vertical stack, shortest to longest by
// DURATION (Month, the shortest period, first; Year, the longest, last),
// not by label character count. Fixed 25 Aug 2026 — the Design System
// owner caught that I'd sorted by string length (Year 4 chars, Month 5,
// Quarter 7 -> Year/Month/Quarter), which produces no legible ordering at
// all and defeats the entire reason for stacking the control vertically.
// Centred as a block within the frame, left-aligned internally. Larger
// than every other frame control (--type-horizon-value, 24 canvas) — the
// only control a viewer operates during the demo.
const HORIZONS: readonly { id: Horizon; label: string }[] = [
  { id: 'month', label: 'Month' },
  { id: 'quarter', label: 'Quarter' },
  { id: 'year', label: 'Year' },
];

export function TimeHorizonControl(): JSX.Element {
  const [horizon, setHorizon] = useContextHorizon();

  return (
    <div role="radiogroup" aria-label="Time Horizon" style={{ display: 'grid', justifyContent: 'center' }}>
      {/* CSS Grid rather than flex's shrink-wrap-then-align, deliberately:
          a single grid-template-columns: max-content track is sized to
          the widest label (Quarter) explicitly, and every button then
          fills that exact column width (default justify-items: stretch)
          — a stronger, more legible guarantee of a shared left edge than
          relying on flex's default cross-axis alignment behavior, which
          previously produced a ragged left edge instead (Design System
          owner's finding, 25 Aug 2026: values were reading as
          individually centred rather than left-aligned within a common
          block). */}
      <div style={{ display: 'grid', gridTemplateColumns: 'max-content', gap: 'var(--horizon-value-gap)' }}>
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
