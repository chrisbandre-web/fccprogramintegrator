import { useEffect, useRef } from 'react';
import { useModuleSession, useContextHorizon } from '../../shell/SessionStateProvider.tsx';
import { Comparison } from './Comparison.tsx';
import { RecordsPanel } from './RecordsPanel.tsx';
import { initialKycState, kycReducer, type KycAction, type KycState } from './moduleState.ts';
import { customerIntakeAlignment } from './alignment.ts';

// TAD §D.6.2 — the module's surface root. Owns its state through
// useModuleSession('kyc-intake', initialState) so it survives leaving and
// re-entering, and its horizon through useContextHorizon('kyc-intake'),
// which initialises to Month on first entry regardless of the Board's
// value (DD §2) — already true of useContextHorizon's own default, so no
// extra logic is needed for that half of §J.4's exit condition.
export function CustomerIntakeModule(): JSX.Element {
  const [state, setState] = useModuleSession<KycState>('kyc-intake', initialKycState);
  const dispatch = (action: KycAction) => setState(kycReducer(state, action));
  const [horizon] = useContextHorizon('kyc-intake');

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
      <div style={{ flex: state.selectedLine === null ? '1 1 auto' : '0 0 30%' }}>
        <Comparison state={state} dispatch={dispatch} alignment={customerIntakeAlignment} />
      </div>
      {state.selectedLine !== null && (
        <div style={{ flex: '1 1 70%', borderTop: '1px solid var(--surface-edge)' }}>
          <RecordsPanel state={state} dispatch={dispatch} selectedLine={state.selectedLine} />
        </div>
      )}
    </div>
  );
}
