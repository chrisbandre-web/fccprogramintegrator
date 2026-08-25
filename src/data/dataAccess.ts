// TAD §C.3, §D.3.2 — SEED CONTRACT (elevated lock, §K.1). No artifact may
// alter this file without a Coordinator-approved amendment to the TAD,
// including when the change looks locally sensible.
//
// The interface declared here, plus nothing else. No component reads the
// fixture directly (TAD-1); every record any surface displays arrives
// through this interface.
import type { CustomerQuery, CustomerRecord, SnapshotMeta } from './types.ts';

export interface CustomerDataAccess {
  query(q: CustomerQuery): readonly CustomerRecord[];
  count(q: CustomerQuery): number;
  /** Provenance for the About panel and the record view. Never a display string. */
  meta(): SnapshotMeta;
}
