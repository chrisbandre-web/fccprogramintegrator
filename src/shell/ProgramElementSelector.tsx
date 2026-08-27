import { moduleRegistry } from '../declarations/registry.ts';
import { useActiveContext } from './SessionStateProvider.tsx';

// TAD §D.5.7 — of the 27 possible contexts (Board + 26 elements), only the
// Board and any status:'live' module are selectable; the rest render
// greyed and unselectable. Registry-driven, not a hardcoded list.
//
// Coordinator direction, 27 Aug 2026: label larger, more space before the
// dropdown, and "Program Board" renamed to "Program Dashboard" (the
// option's display text only -- 'board' stays the internal activeContext
// value; no other file references the old label). Label size PROVISIONAL
// -- reused at --type-horizon-value's literal size (not the token itself,
// to avoid coupling this label to the horizon control's own sizing) per
// the Coordinator's general instruction that most of the frame should
// grow closer to the Month/Quarter/Year labels' size.
export function ProgramElementSelector(): JSX.Element {
  const [activeContext, setActiveContext] = useActiveContext();

  return (
    <label>
      <span
        style={{
          display: 'block',
          font: 'var(--weight-regular) 24px / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-tertiary)',
          marginBottom: 'var(--space-2)',
        }}
      >
        Program Element
      </span>
      <select value={activeContext} onChange={(e) => setActiveContext(e.target.value)}>
        <option value="board">Program Dashboard</option>
        {moduleRegistry.map((d) => (
          <option key={d.id} value={d.id} disabled={d.status !== 'live'}>
            {d.content.month.title}
          </option>
        ))}
      </select>
    </label>
  );
}
