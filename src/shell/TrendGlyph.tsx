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
//
// Base shape points RIGHT (→), not up — the token file's rotation values
// (rising -45deg, flat 0deg, falling 45deg) are calibrated against a
// horizontal baseline: flat stays flat, rising tilts up-right (↗),
// falling tilts down-right (↘). An "up"-based triangle was the original
// bug here (rising landed up-left instead of up-right; flat stood
// straight up instead of lying flat) — caught from a live screenshot,
// 22 Aug 2026.
export function TrendGlyph({ value }: { value: TrendValue }): JSX.Element {
  return (
    <span
      role="img"
      aria-label={LABEL[value]}
      style={{
        display: 'inline-block',
        width: 0,
        height: 0,
        borderTop: 'calc(var(--trend-size) / 2) solid transparent',
        borderBottom: 'calc(var(--trend-size) / 2) solid transparent',
        borderLeft: 'var(--trend-size) solid var(--trend-ink)',
        transform: `rotate(${ROTATION[value]})`,
      }}
    />
  );
}
