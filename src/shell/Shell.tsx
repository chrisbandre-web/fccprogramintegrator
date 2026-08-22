import '../design/elements.css';
import { NavigationFrame } from './NavigationFrame.tsx';
import { Board } from './Board.tsx';
import { CustomerIntakeModule } from '../modules/kyc-intake/CustomerIntakeModule.tsx';
import { useSessionState } from './SessionStateProvider.tsx';

// TAD — the persistent frame and the module content area compose; the
// frame is shell-owned and survives module navigation (⚠️ A15).
export function Shell(): JSX.Element {
  const { activeContextId, setActiveContextId } = useSessionState();

  return (
    <div style={{ display: 'flex', height: '100%', padding: 'var(--canvas-margin)', boxSizing: 'border-box' }}>
      <NavigationFrame />
      <div style={{ flex: 1 }}>
        {activeContextId === 'board' ? (
          <Board onActivateModule={setActiveContextId} />
        ) : (
          <CustomerIntakeModule />
        )}
      </div>
    </div>
  );
}
