import type { ElementContent } from '../declarations/types.ts';
import { HealthMark } from './HealthMark.tsx';
import { TrendGlyph } from './TrendGlyph.tsx';
import { HeroValue } from './HeroValue.tsx';

export function RegisterRow({ content }: { content: ElementContent }): JSX.Element {
  const hero = content.hero.kind === 'authored' ? content.hero : null;
  const trend = content.trend.kind === 'authored' ? content.trend.value : null;
  const health = content.health.kind === 'authored' ? content.health.value : null;

  // Source (feed caption) first, metric description last. Line 2 is a
  // single left-aligned string spanning under both the title and hero
  // columns, so whichever piece sits at the END of the string lands
  // visually under the hero number — and the hero's own description (the
  // metric header) belongs there, not the source attribution. Fixed from
  // a live screenshot, 22 Aug 2026 (Chris): the hero was reading as
  // paired with the source ("KYC system") rather than with what it
  // actually measures ("% Past Due KYC Refresh").
  const line2 = [content.feedCaption, content.metricHeader].filter(Boolean).join(' · ');

  return (
    <div className="register-row" data-status="inactive">
      <span className="register-row__mark">{health && <HealthMark value={health} />}</span>
      <span className="register-row__title">{content.title}</span>
      <span className="register-row__line2">{line2}</span>
      <span className="register-row__hero">
        {hero && <HeroValue value={hero.value} unit={hero.unit} size="register" />}
      </span>
      <span className="register-row__trend">{trend && <TrendGlyph value={trend} />}</span>
    </div>
  );
}
