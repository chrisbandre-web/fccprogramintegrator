// TAD §C.1, §D.4.3 — SEED CONTRACT. The one list. Twenty-five loaded, one
// imported, concatenated, sorted by placement.order. No artifact may alter
// this file's shape without a Coordinator-approved TAD amendment.
import { loadInactiveDeclarations } from './load.ts';
import { customerIntakeModule } from '../modules/kyc-intake/declaration.ts';
import type { ModuleDeclaration } from './types.ts';

const inactiveDeclarations = loadInactiveDeclarations();

export const moduleRegistry: readonly ModuleDeclaration[] = [...inactiveDeclarations, customerIntakeModule].sort(
  (a, b) => a.placement.order - b.placement.order,
);
