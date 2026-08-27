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
//
// Coordinator direction, 27 Aug 2026: both lines larger, with a little
// more separation between them so they read as a clear header-then-value
// pair rather than continuous wrapped text. Sizes PROVISIONAL, reused at
// --type-horizon-value's literal size for both lines (not the token
// itself) per the general "closer to Month/Quarter/Year" instruction.
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
          font: 'var(--weight-regular) 24px / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-tertiary)',
          marginBottom: 'var(--space-1)',
        }}
      >
        Time Period — {horizonQualifier}
      </div>
      <div
        style={{
          font: 'var(--weight-regular) 24px / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-secondary)',
        }}
      >
        {horizonLegend[horizon]}
      </div>
    </div>
  );
}
