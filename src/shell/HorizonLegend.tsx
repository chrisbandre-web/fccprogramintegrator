import { boardContext } from '../declarations/contexts.ts';
import { useSessionState } from './SessionStateProvider.tsx';

// TAD §D.5.9 — renders the active context's horizonLegend[horizon] string.
// Board-only for now (§J.1 — the module's own horizonLegend is authored
// alongside the live module and wired in when the module becomes the
// active context, phase 3+).
export function HorizonLegend(): JSX.Element {
  const { horizon } = useSessionState();
  return (
    <span style={{ font: 'var(--weight-regular) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
      {boardContext.horizonLegend[horizon]}
    </span>
  );
}
