import type { ElementContent } from '../declarations/types.ts';
import { HealthMark } from './HealthMark.tsx';
import { TrendGlyph } from './TrendGlyph.tsx';
import { HeroValue } from './HeroValue.tsx';

export function RegisterRow({ id, content }: { id: string; content: ElementContent }): JSX.Element {
  const hero = content.hero.kind === 'authored' ? content.hero : null;
  const trend = content.trend.kind === 'authored' ? content.trend.value : null;
  const health = content.health.kind === 'authored' ? content.health.value : null;

  return (
    <div className="register-row" data-status="inactive" data-element-id={id}>
      <span className="register-row__mark">{health && <HealthMark value={health} />}</span>
      <span className="register-row__title">{content.title}</span>
      <span className="register-row__source">{content.feedCaption}</span>
      <span className="register-row__hero">
        {hero && <HeroValue value={hero.value} unit={hero.unit} size="register" />}
      </span>
      {content.metricHeader && (
        <span className="register-row__metric">
          <span>{content.metricHeader}</span>
        </span>
      )}
      <span className="register-row__trend">{trend && <TrendGlyph value={trend} />}</span>
    </div>
  );
}
