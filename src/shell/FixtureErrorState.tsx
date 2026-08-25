import { CanvasRoot } from './CanvasRoot.tsx';
import { SessionStateProvider } from './SessionStateProvider.tsx';
import { NavigationFrame } from './NavigationFrame.tsx';

// TAD §D.5.23 — the build's one error state. Reachable only from a
// FixtureLoadError, a DeclarationLoadError or a reference-table assertion
// failure. Renders the approved line in place of the program field, with
// the frame intact — NavigationFrame needs no CustomerDataAccess (it reads
// the declaration registry, not the fixture), so it renders normally even
// when the fixture failed to load.
export function FixtureErrorState(): JSX.Element {
  return (
    <SessionStateProvider>
      <CanvasRoot>
        <div style={{ display: 'flex', height: '100%', padding: 'var(--canvas-margin)', boxSizing: 'border-box' }}>
          <NavigationFrame />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              style={{
                font: 'var(--weight-regular) var(--type-tile-title) / var(--leading-tight) var(--font-family)',
                color: 'var(--ink-primary)',
              }}
            >
              There seems to be a problem, please reload or try again.
            </span>
          </div>
        </div>
      </CanvasRoot>
    </SessionStateProvider>
  );
}
