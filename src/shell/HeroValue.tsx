import { formatHeroValue } from '../lib/format.ts';

export function HeroValue({
  value,
  unit,
  size = 'tile',
}: {
  value: number | string;
  unit: string;
  size?: 'tile' | 'register';
}): JSX.Element {
  return (
    <span
      style={{
        font: `${size === 'tile' ? 'var(--type-tile-hero)' : 'var(--type-register-hero)'} / var(--leading-tight) var(--font-family)`,
        fontWeight: 'var(--weight-semibold)',
        color: 'var(--ink-primary)',
      }}
    >
      {formatHeroValue(value, unit)}
    </span>
  );
}
