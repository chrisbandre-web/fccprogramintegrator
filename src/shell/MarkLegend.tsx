import { boardContext } from '../declarations/contexts.ts';
import { moduleRegistry } from '../declarations/registry.ts';
import type { LegendEntry } from '../declarations/types.ts';
import type { Rating } from '../data/types.ts';
import { useActiveContext } from './SessionStateProvider.tsx';

const RATING_FILL: Record<Rating, string> = {
  High: 'var(--risk-bar-high)',
  Medium: 'var(--risk-bar-medium)',
  Low: 'var(--risk-bar-low)',
};

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
      <div style={{ font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-secondary)', marginBottom: 'var(--space-1)' }}>
        {entry.label}
      </div>
      {/* Design System owner's spec, 26 Aug 2026: 16 canvas / 12 rendered
          square, --space-2 to the label, swatches left-aligned in a
          column with labels aligned to their right, fills exactly
          --risk-bar-{high|medium|low} (the bar values, not the Records'
          text tints), no border — --risk-bar-low at 1.74:1 against the
          ground is visible unaided post-Amendment 1, and a keyline would
          read the low swatch as a different kind of object from the
          other two. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
        {entry.steps.map((s) => (
          <div key={s.rating} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ width: 16, height: 16, flexShrink: 0, background: RATING_FILL[s.rating], borderRadius: 2 }} />
            <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
              {s.label}
            </span>
          </div>
        ))}
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
