import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Horizon } from '../data/types.ts';

// TAD §D.5.4 — one piece of state for the active Time Horizon (default
// 'month', §D.6's board-wide default) and one for the selected context id
// ('board' or a live module's id). Kept as two primitives in one provider
// rather than split across components that could disagree.
interface SessionState {
  readonly horizon: Horizon;
  readonly setHorizon: (h: Horizon) => void;
  readonly activeContextId: string;
  readonly setActiveContextId: (id: string) => void;
}

const SessionStateContext = createContext<SessionState | null>(null);

export function SessionStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const [horizon, setHorizon] = useState<Horizon>('month');
  const [activeContextId, setActiveContextId] = useState('board');

  const value = useMemo(
    () => ({ horizon, setHorizon, activeContextId, setActiveContextId }),
    [horizon, activeContextId],
  );

  return <SessionStateContext.Provider value={value}>{children}</SessionStateContext.Provider>;
}

export function useSessionState(): SessionState {
  const ctx = useContext(SessionStateContext);
  if (!ctx) throw new Error('useSessionState must be used within a SessionStateProvider');
  return ctx;
}
