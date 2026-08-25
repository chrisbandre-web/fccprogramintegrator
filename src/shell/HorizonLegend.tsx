import { boardContext } from '../declarations/contexts.ts';
import { moduleRegistry } from '../declarations/registry.ts';
import { useActiveContext, useContextHorizon } from './SessionStateProvider.tsx';

// TAD §D.5.9 — renders the active context's horizonLegend[horizon]
// string. Board and the live module both carry their own declared
// ByHorizon<string> (§D.4.1); this component composes no sentence of its
// own, in either case.
//
// TouchTwo Amendment 2, DD Appendix A.4 (25 Aug 2026) — adds the "Time
// Period — {qualifier}" header line above the value ("As at" on the
// Board, "Trailing" in a module), and supersedes the construction-time
// compressed value text ("Today"/"T-90") with the confirmed strings.
export function HorizonLegend(): JSX.Element {
  const [activeContext] = useActiveContext();
  const [horizon] = useContextHorizon();

  const declared =
    activeContext === 'board' ? boardContext : moduleRegistry.find((d) => d.id === activeContext);

  const horizonLegend = declared?.horizonLegend ?? boardContext.horizonLegend;
  const horizonQualifier = declared?.horizonQualifier ?? boardContext.horizonQualifier;

  return (
    <div>
      <div
        style={{
          font: 'var(--weight-regular) var(--type-frame-label) / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-tertiary)',
        }}
      >
        Time Period — {horizonQualifier}
      </div>
      <div
        style={{
          font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-secondary)',
        }}
      >
        {horizonLegend[horizon]}
      </div>
    </div>
  );
}
