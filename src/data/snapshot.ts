// TAD §D.3.4 (closes ⚠️ A4) — load the fixture, re-score every record with
// the engine, assert agreement with the stored derivations, freeze the
// result, and expose asOf and provenance. Called by main.tsx before
// createRoot().render() (§D.5.1); this is the build's one synchronous,
// pre-paint, one-time load.
//
// TAD-1 (§L.3): no file outside src/data/ imports
// src/generated/fixture.generated.json. This file is inside src/data/.
import fixtureData from '../generated/fixture.generated.json' with { type: 'json' };
import { score } from '../engine/score.ts';
import type { CustomerRecord, CustomerSource, IsoDate, SnapshotMeta } from './types.ts';

// TAD §L.4.1's verbatim day-arithmetic helper.
const addDays = (d: IsoDate, n: number): IsoDate => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};

export interface Snapshot {
  readonly records: readonly CustomerRecord[];
  readonly asOf: IsoDate;
  readonly meta: SnapshotMeta;
}

export class FixtureLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FixtureLoadError';
  }
}

interface GeneratedFixture {
  meta: SnapshotMeta;
  records: readonly CustomerRecord[];
}

const DERIVED_KEYS = ['score', 'scoredRating', 'rating', 'route'] as const;
const POINT_KEYS = ['entityType', 'industry', 'product', 'jurisdiction', 'tmAlerts'] as const;

/**
 * True if the engine, re-run on this record's source attributes, produces
 * exactly the derived fields the fixture shipped with. Field-by-field
 * rather than JSON.stringify, so a single disagreeing field can be named
 * in the thrown error instead of a raw string diff.
 */
function findDisagreement(source: CustomerSource, stored: CustomerRecord): string | null {
  const derived = score(source);

  for (const key of POINT_KEYS) {
    if (derived.points[key] !== stored.points[key]) {
      return `points.${key}: engine ${derived.points[key]} vs fixture ${stored.points[key]}`;
    }
  }
  for (const key of DERIVED_KEYS) {
    if (derived[key] !== stored[key]) {
      return `${key}: engine ${String(derived[key])} vs fixture ${String(stored[key])}`;
    }
  }
  if (derived.firedFactors.length !== stored.firedFactors.length
    || derived.firedFactors.some((f, i) => f !== stored.firedFactors[i])) {
    return `firedFactors: engine [${derived.firedFactors.join(', ')}] vs fixture [${stored.firedFactors.join(', ')}]`;
  }
  return null;
}

function deepFreeze<T>(value: T): T {
  Object.freeze(value);
  if (value !== null && typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      if (v !== null && typeof v === 'object' && !Object.isFrozen(v)) deepFreeze(v);
    }
  }
  return value;
}

export function buildSnapshot(): Snapshot {
  const fixture = fixtureData as unknown as GeneratedFixture;

  if (!fixture || !Array.isArray(fixture.records) || !fixture.meta) {
    throw new FixtureLoadError('fixture.generated.json is malformed: expected { meta, records }.');
  }
  if (fixture.records.length === 0) {
    throw new FixtureLoadError('fixture.generated.json has zero records.');
  }

  for (const record of fixture.records) {
    const disagreement = findDisagreement(record, record);
    if (disagreement !== null) {
      throw new FixtureLoadError(
        `Scoring disagreement on ${record.reference}: ${disagreement}. ` +
        'The engine and the committed fixture no longer agree — regenerate the fixture ' +
        '(npm run generate:fixture) or investigate the engine change that caused this.',
      );
    }
  }

  assertBookIntakeInvariants(fixture);

  const snapshot: Snapshot = {
    records: fixture.records,
    asOf: fixture.meta.asOf,
    meta: fixture.meta,
  };

  return deepFreeze(snapshot);
}

// TAD §D.3.4, §C.3 (v1.5) — the book/intake invariants, asserted at
// startup because the alternative is a plausible wrong percentage on a
// tile, not a crash. A failure here is loud and named.
function assertBookIntakeInvariants(fixture: GeneratedFixture): void {
  const { asOf, bookCutoff } = fixture.meta;
  const deepestReach = addDays(asOf, -395); // the Board's Year as-at lower bound (§L.4.2)

  if (bookCutoff > deepestReach) {
    throw new FixtureLoadError(
      `bookCutoff (${bookCutoff}) is after asOf-395 (${deepestReach}) — the Board's Year ` +
      "as-at query could reach into book territory. Regenerate the fixture; this shouldn't " +
      'be possible from a correctly-configured generator.',
    );
  }

  const deepestWindowStart = addDays(asOf, -395);
  const deepestWindowEnd = addDays(asOf, -365);
  let onOrBeforeCutoffInDeepestWindow = 0;

  for (const record of fixture.records) {
    if (record.onboardedAt <= bookCutoff && record.onboardedAt > deepestWindowStart && record.onboardedAt <= deepestWindowEnd) {
      onOrBeforeCutoffInDeepestWindow++;
    }
  }

  if (onOrBeforeCutoffInDeepestWindow > 0) {
    throw new FixtureLoadError(
      `${onOrBeforeCutoffInDeepestWindow} record(s) on or before bookCutoff fall inside the ` +
      'deepest intake window (the Board Year as-at) — book/intake contamination has reappeared.',
    );
  }
}
