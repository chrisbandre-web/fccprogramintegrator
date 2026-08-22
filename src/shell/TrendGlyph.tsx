import type { TrendValue } from '../declarations/types.ts';

const ROTATION: Record<TrendValue, string> = {
  Increasing: 'var(--trend-rotation-rising)',
  Stable: 'var(--trend-rotation-flat)',
  Decreasing: 'var(--trend-rotation-falling)',
};

const LABEL: Record<TrendValue, string> = {
  Increasing: 'Increasing',
  Stable: 'Stable',
  Decreasing: 'Decreasing',
};

// A solid triangular glyph, --trend-size, --trend-ink (primary — it has
// lost colour's redundancy). Never takes status colour. The value is never
// displayed as text on the tile itself — only worded in the frame's
// legend. Absence is handled by the caller not rendering this component.
export function TrendGlyph({ value }: { value: TrendValue }): JSX.Element {
  return (
    <span
      role="img"
      aria-label={LABEL[value]}
      style={{
        display: 'inline-block',
        width: 0,
        height: 0,
        borderLeft: 'calc(var(--trend-size) / 2) solid transparent',
        borderRight: 'calc(var(--trend-size) / 2) solid transparent',
        borderBottom: 'var(--trend-size) solid var(--trend-ink)',
        transform: `rotate(${ROTATION[value]})`,
      }}
    />
  );
}
