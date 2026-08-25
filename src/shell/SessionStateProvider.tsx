import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Horizon } from '../data/types.ts';

// TAD §D.5.4 — holds the three things that must survive navigation, and
// nothing else. horizonByContext is deliberately NOT inside moduleState:
// the shell's Time Horizon control must read and write it directly, and
// keeping it in its own map keyed by context is what lets one widget
// serve two contexts (Board, module) without either knowing about the
// other (§E.1's "neither can write to the other").
interface SessionState {
  activeContext: string;
  horizonByContext: Record<string, Horizon>;
  moduleState: Record<string, unknown>;
}

interface SessionStateApi {
  activeContext: string;
  setActiveContext: (id: string) => void;
  horizonByContext: Record<string, Horizon>;
  setContextHorizon: (contextId: string, h: Horizon) => void;
  moduleState: Record<string, unknown>;
  setModuleState: (moduleId: string, next: unknown) => void;
}

const SessionStateContext = createContext<SessionStateApi | null>(null);

export function SessionStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<SessionState>({
    activeContext: 'board',
    horizonByContext: {},
    moduleState: {},
  });

  const setActiveContext = useCallback((id: string) => {
    setState((s) => (s.activeContext === id ? s : { ...s, activeContext: id }));
  }, []);

  const setContextHorizon = useCallback((contextId: string, h: Horizon) => {
    setState((s) => ({ ...s, horizonByContext: { ...s.horizonByContext, [contextId]: h } }));
  }, []);

  const setModuleState = useCallback((moduleId: string, next: unknown) => {
    setState((s) => ({ ...s, moduleState: { ...s.moduleState, [moduleId]: next } }));
  }, []);

  const value = useMemo<SessionStateApi>(
    () => ({
      activeContext: state.activeContext,
      setActiveContext,
      horizonByContext: state.horizonByContext,
      setContextHorizon,
      moduleState: state.moduleState,
      setModuleState,
    }),
    [state, setActiveContext, setContextHorizon, setModuleState],
  );

  return <SessionStateContext.Provider value={value}>{children}</SessionStateContext.Provider>;
}

function useSessionStateApi(): SessionStateApi {
  const ctx = useContext(SessionStateContext);
  if (!ctx) throw new Error('useSessionState hooks must be used within a SessionStateProvider');
  return ctx;
}

// TAD §D.5.7 — ProgramElementSelector's out: sets activeContext.
export function useActiveContext(): readonly [string, (id: string) => void] {
  const { activeContext, setActiveContext } = useSessionStateApi();
  return [activeContext, setActiveContext] as const;
}

// TAD §D.5.8, §D.6.2 — no argument reads/writes the currently active
// context's horizon (TimeHorizonControl's use); an explicit contextId
// reads/writes that context's horizon regardless of which is active
// (the module's own use, §D.6.2: "initialises to Month on first entry
// regardless of the Board's value"). Every key defaults to 'month'
// (§D.5.4's own interface comment) until first written.
export function useContextHorizon(contextId?: string): readonly [Horizon, (h: Horizon) => void] {
  const { activeContext, horizonByContext, setContextHorizon } = useSessionStateApi();
  const key = contextId ?? activeContext;
  const horizon = horizonByContext[key] ?? 'month';
  const setHorizon = useCallback((h: Horizon) => setContextHorizon(key, h), [key, setContextHorizon]);
  return [horizon, setHorizon] as const;
}

// TAD §L.4.9, verbatim signature. moduleState is typed unknown at the
// provider and read only through this hook, so the shell provides storage
// and never inspects the shape.
export function useModuleSession<T>(moduleId: string, initial: T): readonly [T, (next: T) => void] {
  const { moduleState, setModuleState } = useSessionStateApi();
  const value = (moduleState[moduleId] as T | undefined) ?? initial;
  const setValue = useCallback((next: T) => setModuleState(moduleId, next), [moduleId, setModuleState]);
  return [value, setValue] as const;
}
