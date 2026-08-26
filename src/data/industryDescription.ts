// TAD-2: no file under src/shell/ or src/modules/ imports anything from
// src/engine/reference/. industryDescription() is genuinely engine-side
// (canonical text derived from CRRM §3.1's own NAICS list, TAD §D.2.3),
// so RecordTable needs it but cannot import it directly. src/data/ is
// the existing sanctioned bridge between the engine and the module layer
// (snapshot.ts already imports score() the same way) — this is that same
// bridge, for the one other engine-reference export a display surface
// needs.
export { industryDescription } from '../engine/reference/industries.ts';
