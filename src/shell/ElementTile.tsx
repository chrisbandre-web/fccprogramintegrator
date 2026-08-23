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
  // Corrected per the Design System Spec §8.1 (verified directly, 23 Aug
  // 2026, after the Design System owner's note revealed the original
  // reading was backwards): scrim belongs to INACTIVE elements, not the
  // live tile. "Surface = live-fill... ink-primary throughout" (Live) vs
  // "Surface + scrim 0.32... ink-primary for all text" (Inactive) — both
  // states use primary ink for metric header and caption, for different
  // reasons (live: design emphasis; inactive: secondary fails AA through
  // the scrim, 3.75:1). So it's simply primary, always, for these two
  // fields — no live/inactive branch needed here at all.

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onActivate?.();
    }
  };

  const truncate = { whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const };

  // Title and metric header now share one row instead of stacking as two
  // separate lines — Chris's suggestion, 22 Aug 2026, to close the
  // vertical-content shortfall inside the fixed 140px tile-band height.
  // A shared row's height is the TALLER of the two (title's 30px), not
  // both lines added together (30+20=50), recovering 20px of the 26px
  // measured shortfall on its own — title never truncates (flexShrink:
  // 0, it's the more load-bearing of the two); metric header truncates
  // if the combined row doesn't have room for both (minWidth: 0 is
  // required for a flex child to shrink below its content's natural
  // width — without it, overflow/ellipsis on a flex item is silently
  // ignored).
  const inner = (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)' }}>
        <span className="truncate-text" style={{ font: 'var(--weight-semibold) var(--type-tile-title) / var(--leading-tight) var(--font-family)', color: 'var(--ink-primary)', flexShrink: 0, ...truncate }}>
          {content.title}
        </span>
        {content.metricHeader && (
          <span className="truncate-text" style={{ font: 'var(--weight-regular) var(--type-metric-header) / var(--leading-tight) var(--font-family)', color: 'var(--ink-primary)', minWidth: 0, ...truncate }}>
            {content.metricHeader}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'auto' }}>
        {hero && <HeroValue value={hero.value} unit={hero.unit} size="tile" />}
        {trend && <TrendGlyph value={trend} />}
        {health && <HealthMark value={health} />}
      </div>
      <span className="truncate-text" style={{ font: 'var(--weight-regular) var(--type-caption) / var(--leading-tight) var(--font-family)', color: 'var(--ink-primary)', ...truncate }}>
        {content.feedCaption}
      </span>
    </>
  );

  return (
    <div
      className={`element-tile${status === 'inactive' ? ' scrim' : ''}`}
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
