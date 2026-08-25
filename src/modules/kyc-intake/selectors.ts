// TAD §D.6.4 — pure functions over CustomerDataAccess. No React, no
// components, no state: every value is computed on render from query()
// results and never separately stored (DD §8). This file grows with each
// phase; phase 3 added the Board's as-at share, phase 4 adds the
// Comparison's compositions. The record page (phase 5) is this file's
// next addition.
import type { CustomerDataAccess } from '../../data/dataAccess.ts';
import type { BusinessLine, CustomerQuery, Horizon, IsoDate } from '../../data/types.ts';

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

// TAD §D.2's interaction table / §C.3: the module's trailing window is
// always the snapshot's own asOf; only windowDays moves with horizon.
const HORIZON_WINDOW_DAYS: Record<Horizon, number> = { month: 30, quarter: 90, year: 365 };

export interface Composition {
  readonly high: number; // share, 0-100
  readonly medium: number;
  readonly low: number;
  readonly total: number; // record count — carried so a sparse result (Retail: 1) can be shown, not hidden
}

function compositionFromQuery(data: CustomerDataAccess, base: CustomerQuery): Composition {
  const total = data.count(base);
  if (total === 0) return { high: 0, medium: 0, low: 0, total: 0 };
  const high = data.count({ ...base, rating: 'High' });
  const medium = data.count({ ...base, rating: 'Medium' });
  const low = data.count({ ...base, rating: 'Low' });
  return { high: (100 * high) / total, medium: (100 * medium) / total, low: (100 * low) / total, total };
}

/**
 * TAD §D.6.4/§D.6.5: the established book's composition — population
 * 'book', ignores horizon entirely (§C.3). Omit businessLine for the
 * whole book (the standing anchor); pass it for one line's book row.
 */
export function bookComposition(data: CustomerDataAccess, businessLine?: BusinessLine): Composition {
  return compositionFromQuery(data, businessLine ? { population: 'book', businessLine } : { population: 'book' });
}

/**
 * TAD §D.6.4/§D.6.5: recent intake's composition for the module's
 * selected horizon — population 'intake', asOf defaults to the
 * snapshot's own (the module's trailing window, never the Board's as-at).
 * Omit businessLine for the whole-intake aggregate row.
 */
export function intakeComposition(data: CustomerDataAccess, horizon: Horizon, businessLine?: BusinessLine): Composition {
  const windowDays = HORIZON_WINDOW_DAYS[horizon];
  const base: CustomerQuery = businessLine ? { population: 'intake', windowDays, businessLine } : { population: 'intake', windowDays };
  return compositionFromQuery(data, base);
}

