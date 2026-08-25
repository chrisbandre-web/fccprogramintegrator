// TAD §D.3.3 — answers queries by filtering the frozen snapshot. Not the
// engine (the snapshot arrives scored, §D.3.4). Constructed once at the
// composition root (main.tsx) and never re-created.
import type { CustomerDataAccess } from './dataAccess.ts';
import type { CustomerQuery, CustomerRecord, SnapshotMeta } from './types.ts';
import type { Snapshot } from './snapshot.ts';

// TAD §L.4.1: window membership is addDays(asOf, -windowDays) < onboardedAt
// <= asOf — lower bound exclusive, upper inclusive.
const addDays = (d: string, n: number): string => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};

/** Stable cache key: sorted keys so two calls that build the same query
 * object with fields in a different order still hit the same cache entry. */
function serialiseQuery(q: CustomerQuery): string {
  return JSON.stringify(
    Object.keys(q)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = (q as unknown as Record<string, unknown>)[k];
        return acc;
      }, {}),
  );
}

export function createFixtureDataAccess(snapshot: Snapshot): CustomerDataAccess {
  const cache = new Map<string, readonly CustomerRecord[]>();

  function runQuery(q: CustomerQuery): readonly CustomerRecord[] {
    const key = serialiseQuery(q);
    const cached = cache.get(key);
    if (cached) return cached;

    let pool: readonly CustomerRecord[];

    if (q.population === 'book') {
      // TAD §C.3 (v1.5) — population is a date predicate, not a stored
      // classification. A record belongs to the established book iff
      // onboardedAt <= meta.bookCutoff; asOf and windowDays are ignored.
      pool = snapshot.records.filter((r) => r.onboardedAt <= snapshot.meta.bookCutoff);
    } else {
      if (q.windowDays === undefined) {
        throw new Error("CustomerDataAccess.query: windowDays is required when population is 'intake'.");
      }
      const asOf = q.asOf ?? snapshot.asOf;
      const lowerExclusive = addDays(asOf, -q.windowDays);
      pool = snapshot.records.filter((r) => r.onboardedAt > lowerExclusive && r.onboardedAt <= asOf);
    }

    let result = pool;
    if (q.businessLine !== undefined) {
      const line = q.businessLine;
      result = result.filter((r) => r.businessLine === line);
    }
    if (q.rating !== undefined) {
      const rating = q.rating;
      result = result.filter((r) => r.rating === rating);
    }

    const frozen = Object.freeze(result.slice());
    cache.set(key, frozen);
    return frozen;
  }

  return {
    query(q: CustomerQuery): readonly CustomerRecord[] {
      return runQuery(q);
    },
    count(q: CustomerQuery): number {
      return runQuery(q).length;
    },
    meta(): SnapshotMeta {
      return snapshot.meta;
    },
  };
}
