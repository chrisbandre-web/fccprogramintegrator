// The module's registered id (declaration.ts's ModuleDeclaration.id,
// which Shell.tsx matches against activeContext) and its session-state
// key (useModuleSession, useContextHorizon) must be the same string --
// they weren't. declaration.ts registers 'customers'; every component
// that keys into session state hardcoded the literal 'kyc-intake'
// instead (a leftover from this module's folder name, never reconciled
// against its actual registered id). TimeHorizonControl reads/writes
// horizonByContext[activeContext] with no argument; this module's own
// components read/wrote horizonByContext['kyc-intake'] explicitly -- two
// different keys that never agreed, so a horizon change while Records
// was open never reached the module at all. Found live, 27 Aug 2026.
//
// Extracted to its own file, rather than fixed as a literal-swap in each
// call site, specifically to break a circular import: declaration.ts
// already imports CustomerIntakeModule.tsx (to attach it as the
// declaration's surface), so declaration.ts cannot also import the
// constant back from CustomerIntakeModule.tsx or from any component
// declaration.ts's own import graph reaches. This file has no
// dependencies of its own, so every one of those files -- declaration.ts
// included -- can import it without creating a cycle.
export const MODULE_ID = 'customers';
