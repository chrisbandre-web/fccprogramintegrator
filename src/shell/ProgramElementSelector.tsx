import { moduleRegistry } from '../declarations/registry.ts';
import { useActiveContext } from './SessionStateProvider.tsx';

// TAD §D.5.7 — of the 27 possible contexts (Board + 26 elements), only the
// Board and any status:'live' module are selectable; the rest render
// greyed and unselectable. Registry-driven, not a hardcoded list.
export function ProgramElementSelector(): JSX.Element {
  const [activeContext, setActiveContext] = useActiveContext();

  return (
    <label>
      <span style={{ display: 'block', font: 'var(--weight-regular) var(--type-caption) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
        Program Element
      </span>
      <select value={activeContext} onChange={(e) => setActiveContext(e.target.value)}>
        <option value="board">Program Board</option>
        {moduleRegistry.map((d) => (
          <option key={d.id} value={d.id} disabled={d.status !== 'live'}>
            {d.content.month.title}
          </option>
        ))}
      </select>
    </label>
  );
}
