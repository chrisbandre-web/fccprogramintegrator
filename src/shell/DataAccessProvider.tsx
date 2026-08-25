import { createContext, useContext, type ReactNode } from 'react';
import type { CustomerDataAccess } from '../data/dataAccess.ts';

// TAD §D.5.2, §G — App.tsx's dependency list names DataAccessProvider and
// the assembly tree places it directly under App, above
// SessionStateProvider. main.tsx constructs the one CustomerDataAccess
// implementation and injects it as App's `data` prop (§D.5.1); this
// provider is the plumbing that makes it reachable from ElementTile and
// the module's selectors without threading it through every component's
// props. No component schema entry names this file (it sits alongside
// SessionStateProvider, §D.5.4, following the same pattern) because it
// carries no state and makes no decision — it is implementation detail
// below the level the TAD specifies (Playbook, "What the Engineer decides
// alone").
const DataAccessContext = createContext<CustomerDataAccess | null>(null);

export function DataAccessProvider({
  data,
  children,
}: {
  data: CustomerDataAccess;
  children: ReactNode;
}): JSX.Element {
  return <DataAccessContext.Provider value={data}>{children}</DataAccessContext.Provider>;
}

export function useDataAccess(): CustomerDataAccess {
  const ctx = useContext(DataAccessContext);
  if (!ctx) throw new Error('useDataAccess must be used within a DataAccessProvider');
  return ctx;
}
