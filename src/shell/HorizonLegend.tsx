import { boardContext } from '../declarations/contexts.ts';
import { moduleRegistry } from '../declarations/registry.ts';
import { useActiveContext, useContextHorizon } from './SessionStateProvider.tsx';

// TAD §D.5.9 — renders the active context's horizonLegend[horizon]
// string. Board and the live module both carry their own declared
// ByHorizon<string> (§D.4.1); this component composes no sentence of its
// own, in either case.
export function HorizonLegend(): JSX.Element {
  const [activeContext] = useActiveContext();
  const [horizon] = useContextHorizon();

  const horizonLegend =
    activeContext === 'board'
      ? boardContext.horizonLegend
      : moduleRegistry.find((d) => d.id === activeContext)?.horizonLegend ?? boardContext.horizonLegend;

  return (
    <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
      {horizonLegend[horizon]}
    </span>
  );
}
