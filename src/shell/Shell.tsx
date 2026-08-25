import '../design/elements.css';
import { NavigationFrame } from './NavigationFrame.tsx';
import { Board } from './Board.tsx';
import { moduleRegistry } from '../declarations/registry.ts';
import { useActiveContext } from './SessionStateProvider.tsx';

// TAD §D.5.5 — the persistent frame and the module content area compose;
// the frame is shell-owned and survives module navigation (⚠️ A15). The
// lookup is moduleRegistry.find(m => m.id === activeContext)?.surface —
// the shell names no module. A second live module needs no change here.
export function Shell(): JSX.Element {
  const [activeContext, setActiveContext] = useActiveContext();
  const Surface = moduleRegistry.find((m) => m.id === activeContext)?.surface;

  return (
    <div style={{ display: 'flex', height: '100%', padding: 'var(--canvas-margin)', boxSizing: 'border-box' }}>
      <NavigationFrame />
      <div style={{ flex: 1 }}>
        {activeContext === 'board' ? <Board onActivateModule={setActiveContext} /> : Surface ? <Surface /> : null}
      </div>
    </div>
  );
}
