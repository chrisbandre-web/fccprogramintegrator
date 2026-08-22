import { CanvasRoot } from './shell/CanvasRoot.tsx';
import { SessionStateProvider } from './shell/SessionStateProvider.tsx';
import { Shell } from './shell/Shell.tsx';
import { OverflowSentinel } from './shell/OverflowSentinel.tsx';

// TAD §D.5.1/§D.5.2 — DataAccessProvider joins this tree in phase 3
// (§J.3); phase 1 has no data access to provide (§D.6.1's Implementation
// Note — the live tile's resolvers are constants until then).
export function App(): JSX.Element {
  return (
    <SessionStateProvider>
      <CanvasRoot>
        <Shell />
        <OverflowSentinel />
      </CanvasRoot>
    </SessionStateProvider>
  );
}
