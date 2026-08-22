import type { ElementContent } from '../declarations/types.ts';
import { HealthMark } from './HealthMark.tsx';
import { TrendGlyph } from './TrendGlyph.tsx';
import { HeroValue } from './HeroValue.tsx';

export function RegisterRow({ content }: { content: ElementContent }): JSX.Element {
  const hero = content.hero.kind === 'authored' ? content.hero : null;
  const trend = content.trend.kind === 'authored' ? content.trend.value : null;
  const health = content.health.kind === 'authored' ? content.health.value : null;

  const line2 = [content.metricHeader, content.feedCaption].filter(Boolean).join(' · ');

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
