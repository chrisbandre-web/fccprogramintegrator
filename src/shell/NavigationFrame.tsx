import { ProgramElementSelector } from './ProgramElementSelector.tsx';
import { TimeHorizonControl } from './TimeHorizonControl.tsx';
import { HorizonLegend } from './HorizonLegend.tsx';
import { MarkLegend } from './MarkLegend.tsx';
import { AboutAffordance } from './AboutAffordance.tsx';

export function NavigationFrame(): JSX.Element {
  return (
    <div
      style={{
        width: 'var(--frame-width)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        paddingRight: 'var(--field-gutter)',
      }}
    >
      <div style={{ font: 'var(--weight-semibold) var(--type-tile-title) / var(--leading-tight) var(--font-family)', color: 'var(--ink-primary)' }}>
        FCC Program Integrator
      </div>
      <ProgramElementSelector />
      <TimeHorizonControl />
      <HorizonLegend />
      <MarkLegend />
      <AboutAffordance />
    </div>
  );
}
