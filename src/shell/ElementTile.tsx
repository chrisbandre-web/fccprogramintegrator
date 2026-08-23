import type { KeyboardEvent } from 'react';
import type { ElementContent, HeroSlot, TrendSlot } from '../declarations/types.ts';
import { HeroValue } from './HeroValue.tsx';
import { TrendGlyph } from './TrendGlyph.tsx';
import { HealthMark } from './HealthMark.tsx';

function resolveHero(slot: HeroSlot, horizon: 'month' | 'quarter' | 'year'): { value: number | string; unit: string } | null {
  if (slot.kind === 'absent') return null;
  if (slot.kind === 'authored') return { value: slot.value, unit: slot.unit };
  return slot.resolve({ horizon });
}

function resolveTrend(slot: TrendSlot, horizon: 'month' | 'quarter' | 'year') {
  if (slot.kind === 'absent') return null;
  if (slot.kind === 'authored') return slot.value;
  return slot.resolve({ horizon });
}

export function ElementTile({
  id,
  content,
  horizon,
  status,
  onActivate,
}: {
  id: string;
  content: ElementContent;
  horizon: 'month' | 'quarter' | 'year';
  status: 'live' | 'inactive';
  onActivate?: () => void;
}): JSX.Element {
  const hero = resolveHero(content.hero, horizon);
  const trend = resolveTrend(content.trend, horizon);
  const health = content.health.kind === 'authored' ? content.health.value : null;

  const interactive = status === 'live' && !!onActivate;
  // TAD Handoff, "load-bearing not stylistic" #5: scrimmed elements set
  // their metric header and caption in PRIMARY ink — secondary fails AA
  // through the scrim (3.75:1). Only the live tile is scrimmed.
  const bodyInk = status === 'live' ? 'var(--ink-primary)' : 'var(--ink-secondary)';

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate?.();
    }
  };

  const truncate = { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const };

  const inner = (
    <>
      <span className="truncate-text" style={{ font: 'var(--weight-semibold) var(--type-tile-title) / var(--leading-tight) var(--font-family)', color: 'var(--ink-primary)', ...truncate }}>
        {content.title}
      </span>
      {content.metricHeader && (
        <span className="truncate-text" style={{ font: 'var(--weight-regular) var(--type-metric-header) / var(--leading-tight) var(--font-family)', color: bodyInk, ...truncate }}>
          {content.metricHeader}
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'auto' }}>
        {hero && <HeroValue value={hero.value} unit={hero.unit} size="tile" />}
        {trend && <TrendGlyph value={trend} />}
        {health && <HealthMark value={health} />}
      </div>
      <span className="truncate-text" style={{ font: 'var(--weight-regular) var(--type-caption) / var(--leading-tight) var(--font-family)', color: bodyInk, ...truncate }}>
        {content.feedCaption}
      </span>
    </>
  );

  return (
    <div
      className={`element-tile${status === 'live' ? ' scrim' : ''}`}
      data-status={status}
      data-element-id={id}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? onActivate : undefined}
      onKeyDown={handleKeyDown}
    >
      {inner}
    </div>
  );
}
