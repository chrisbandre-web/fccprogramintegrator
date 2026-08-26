// TAD §D.5.1 — the composition root. Nine or ten lines, and they are the
// most consequential in the build: scoring completes before React exists,
// so no surface can render before the numbers do and no loading state is
// representable. When a backend arrives, buildSnapshot() gains an
// await above createRoot and nothing else in the repository changes.
import './design/tokens.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.tsx';
import { FixtureErrorState } from './shell/FixtureErrorState.tsx';
import { buildSnapshot } from './data/snapshot.ts';
import { createFixtureDataAccess } from './data/fixtureDataAccess.ts';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('#root element not found');

const root = createRoot(rootEl);

// Decision-support route, not part of the shipped app: a side-by-side
// comparison of register-scrim candidates for the Coordinator to look at
// directly (src/dev/ScrimCandidates.tsx). Checked before the real
// composition root runs, and takes no dependency on it. Delete this
// block and src/dev/ once the scrim value is chosen.
if (new URLSearchParams(window.location.search).has('scrimPreview')) {
  void (async () => {
    const { ScrimCandidates } = await import('./dev/ScrimCandidates.tsx');
    root.render(
      <StrictMode>
        <ScrimCandidates />
      </StrictMode>,
    );
  })();
} else {
  try {
    const snapshot = buildSnapshot();
    const data = createFixtureDataAccess(snapshot);
    root.render(
      <StrictMode>
        <App data={data} />
      </StrictMode>,
    );
  } catch (err) {
    // FixtureLoadError, or any other failure in the pre-paint load — the
    // build's one error state (§D.5.23). Logged for the console, never
    // shown as detail on screen (DD §3 — one message, no diagnostics).
    console.error(err);
    root.render(<FixtureErrorState />);
  }
}
