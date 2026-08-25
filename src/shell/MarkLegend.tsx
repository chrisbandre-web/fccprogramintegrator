import { boardContext } from '../declarations/contexts.ts';
import { moduleRegistry } from '../declarations/registry.ts';
import type { LegendEntry } from '../declarations/types.ts';
import { useActiveContext } from './SessionStateProvider.tsx';

function LegendItem({ entry }: { entry: LegendEntry }): JSX.Element {
  if (entry.kind === 'health-and-trend') {
    return (
      <div>
        <div style={{ font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-secondary)' }}>
          {entry.label}
        </div>
        <div style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
          Mark: {entry.markMeans}. Arrow: {entry.arrowMeans}.
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-secondary)' }}>
        {entry.label}
      </div>
      <div style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
        {entry.steps.map((s) => s.label).join(' → ')}
      </div>
    </div>
  );
}

// TAD §D.5.10 — renders the active context's declared LegendEntry[].
export function MarkLegend(): JSX.Element {
  const [activeContext] = useActiveContext();
  const legend =
    activeContext === 'board'
      ? boardContext.legend
      : moduleRegistry.find((d) => d.id === activeContext)?.legend ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {legend.map((entry, i) => (
        <LegendItem entry={entry} key={i} />
      ))}
    </div>
  );
}
