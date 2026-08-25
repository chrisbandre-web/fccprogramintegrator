// TAD §D.6.4 — pure functions over CustomerDataAccess. No React, no
// components, no state: every value is computed on render from query()
// results and never separately stored (DD §8). This phase (§J.3) needs
// only the Board's as-at High share for the Customers live tile; the
// Comparison's compositions and the Records page are phases 4-5's
// additions to this same file.
import type { CustomerDataAccess } from '../../data/dataAccess.ts';
import type { IsoDate } from '../../data/types.ts';

/**
 * TAD §D.6.1: the Board's as-at High share — population 'intake', queried
 * at the given asOf with a 30-day window (§L.4.2's Board row). Composition
 * is count(rating) / count(all), from the same count() primitive
 * (§D.6.4's Implementation Note) — no aggregate is stored anywhere.
 */
export function asAtHighShare(data: CustomerDataAccess, asOf: IsoDate): number {
  const total = data.count({ population: 'intake', asOf, windowDays: 30 });
  if (total === 0) return 0;
  const high = data.count({ population: 'intake', asOf, windowDays: 30, rating: 'High' });
  return (100 * high) / total;
}
