import { useEffect, useRef } from 'react';
import { useModuleSession, useContextHorizon } from '../../shell/SessionStateProvider.tsx';
import { Comparison } from './Comparison.tsx';
import { RecordsPanel } from './RecordsPanel.tsx';
import { initialKycState, kycReducer, type KycAction, type KycState } from './moduleState.ts';
import { customerIntakeAlignment } from './alignment.ts';
import { MODULE_ID } from './moduleId.ts';

// TAD §D.6.2 — the module's surface root. Owns its state through
// useModuleSession(MODULE_ID, initialState) so it survives leaving and
// re-entering, and its horizon through useContextHorizon(MODULE_ID),
// which initialises to Month on first entry regardless of the Board's
// value (DD §2) — already true of useContextHorizon's own default, so no
// extra logic is needed for that half of §J.4's exit condition.
//
// MODULE_ID, not a literal here or anywhere else in this module (fixed
// 27 Aug 2026) — see moduleId.ts. The literal 'kyc-intake' this file,
// Comparison.tsx and RecordsPanel.tsx all used to hardcode never matched
// declaration.ts's actual registered id ('customers'), which is what
// activeContext -- and therefore TimeHorizonControl, which keys off
// activeContext with no argument -- actually becomes. The Time Horizon
// control changed a horizon this module was never reading.
export function CustomerIntakeModule(): JSX.Element {
  const [state, setState] = useModuleSession<KycState>(MODULE_ID, initialKycState);
  const dispatch = (action: KycAction) => setState(kycReducer(state, action));
  const [horizon] = useContextHorizon(MODULE_ID);

  // TAD §D.6.3's Implementation Note: page resets on a line change, a
  // filter change (both handled inside the reducer) or a horizon change
  // (dispatched from here, since horizon lives in SessionStateProvider,
  // not in KycState).
  const previousHorizon = useRef(horizon);
  useEffect(() => {
    if (previousHorizon.current !== horizon) {
      dispatch({ type: 'resultSetChanged' });
      previousHorizon.current = horizon;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [horizon]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: state.selectedLine === null ? '1 1 auto' : '0 0 30%', minHeight: 0 }}>
        <Comparison state={state} dispatch={dispatch} alignment={customerIntakeAlignment} />
      </div>
      {state.selectedLine !== null && (
        // minHeight: 0, same reason as RecordsPanel.tsx's own content
        // div: without it, this flex child refuses to shrink below its
        // content's full height (the classic flex min-height: auto
        // trap), so overflow: auto one level down never gets anything
        // to actually do — content overflows THIS element's boundary
        // instead and gets clipped by the canvas's own fixed edge,
        // nowhere near a scrollable region. Fixed alongside
        // RecordsPanel.tsx's own fix, 27 Aug 2026, second pass at UAT
        // C4 — the first fix (overflow: hidden -> auto) was necessary
        // but not sufficient on its own.
        <div style={{ flex: '1 1 70%', minHeight: 0, borderTop: '1px solid var(--surface-edge)' }}>
          <RecordsPanel state={state} dispatch={dispatch} selectedLine={state.selectedLine} />
        </div>
      )}
    </div>
  );
}
