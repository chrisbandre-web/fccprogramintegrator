import { Component, type ReactNode } from 'react';
import { CanvasRoot } from './shell/CanvasRoot.tsx';
import { SessionStateProvider } from './shell/SessionStateProvider.tsx';
import { DataAccessProvider } from './shell/DataAccessProvider.tsx';
import { Shell } from './shell/Shell.tsx';
import { OverflowSentinel } from './shell/OverflowSentinel.tsx';
import { FixtureErrorState } from './shell/FixtureErrorState.tsx';
import type { CustomerDataAccess } from './data/dataAccess.ts';

// TAD §D.5.2 — an error boundary catching render-time failures (a
// DeclarationLoadError or a reference-table assertion failure surfacing
// during render) into FixtureErrorState. The composition root's own
// FixtureLoadError path (buildSnapshot(), before React exists) is handled
// in main.tsx, not here — this boundary is the second, narrower net.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }
  override render(): ReactNode {
    if (this.state.hasError) return <FixtureErrorState />;
    return this.props.children;
  }
}

// TAD §D.5.2 — composes DataAccessProvider, SessionStateProvider,
// CanvasRoot, Shell and OverflowSentinel in one readable place, and holds
// the error boundary. Phase 3 (§J.3) wires DataAccessProvider with the
// data-access implementation main.tsx constructs and injects as `data`.
export function App({ data }: { data: CustomerDataAccess }): JSX.Element {
  return (
    <ErrorBoundary>
      <DataAccessProvider data={data}>
        <SessionStateProvider>
          <CanvasRoot>
            <Shell />
            <OverflowSentinel />
          </CanvasRoot>
        </SessionStateProvider>
      </DataAccessProvider>
    </ErrorBoundary>
  );
}
