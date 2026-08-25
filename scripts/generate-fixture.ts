// TAD §D.1.2 — produces the four populations as source attributes only,
// scores them with the real engine, and emits
// src/generated/fixture.generated.json plus a validation report against
// DD §3's 22 checks. Build-time only, run by `npm run generate:fixture`.
// Imports nothing from src/data, src/shell or src/modules.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as cfg from '../config/fixture.config.ts';
import { score } from '../src/engine/score.ts';
import { jurisdictionBand } from '../src/engine/reference/jurisdictions.ts';
import type { CustomerSource, CustomerRecord, BusinessLine, IsoDate } from '../src/data/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_PATH = join(ROOT, 'src', 'generated', 'fixture.generated.json');

// --- Seeded PRNG (mulberry32) — dependency-free, deterministic --------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(cfg.randomSeed);
const pick = <T,>(arr: readonly T[]): T => {
  const item = arr[Math.floor(rng() * arr.length)];
  if (item === undefined) throw new Error('pick() called on an empty array');
  return item;
};
const randInt = (min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));

// --- Dates (TAD §L.4.1, verbatim helper) ------------------------------------

const addDays = (d: IsoDate, n: number): IsoDate => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};

/** monthsAgo -> the 30-day bucket (asOf - 30*(monthsAgo+1), asOf - 30*monthsAgo]. */
function bucketRange(monthsAgo: number): { start: IsoDate; end: IsoDate } {
  return { start: addDays(cfg.asOf, -30 * (monthsAgo + 1)), end: addDays(cfg.asOf, -30 * monthsAgo) };
}
function randomDateInBucket(monthsAgo: number): IsoDate {
  const { start } = bucketRange(monthsAgo);
  return addDays(start, randInt(1, 30)); // exclusive lower bound, inclusive upper (§L.4.1)
}

/**
 * Assigns dates for a whole bucket's worth of records by evenly spreading
 * them across the bucket's 30 days, rather than drawing each date
 * independently at random. Pure per-record randomness clusters by chance
 * at small counts, which is invisible at whole-bucket granularity (the
 * checks that query a full bucket, or a union of full buckets, are
 * unaffected) but becomes real sampling noise for a check that queries a
 * *partial* bucket -- Board-year draws a 30-day window straddling the tail
 * of one baseline bucket and the head of the next, and with only ~9-11
 * High records in a 240-record bucket, a few records landing on the wrong
 * side of that internal split swings the resulting percentage well past
 * DD-6a's ±0.5pp tolerance. Evenly spreading removes that noise: which
 * *specific* records fall in the queried slice is still effectively
 * randomised (the list is shuffled first), but *how many* is now close to
 * the exact proportional share.
 */
function assignSpreadDates<T>(monthsAgo: number, items: readonly T[]): { item: T; onboardedAt: IsoDate }[] {
  const { start } = bucketRange(monthsAgo);
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = a;
  }
  const n = shuffled.length;
  return shuffled.map((item, i) => ({ item, onboardedAt: addDays(start, Math.min(30, 1 + Math.floor(((i + 0.5) * 30) / Math.max(1, n)))) }));
}
// TAD §D.1.2, §C.3 (v1.5) — the book/intake date floor. intakeBuckets and
// bucketDays, named here rather than left as inline literals, because
// bookCutoff is derived from them, not hardcoded (§L.4's "everything
// specified rather than left to judgement"). MONTHS is the same constant
// the intake loop below already used pre-v1.5; kept as one name so the
// bucket count that drives intake generation and the cutoff that bounds
// book generation can never silently diverge.
const BUCKET_DAYS = 30;
const MONTHS = 14; // 13 wasn't enough: Board-year's window (asOf offset 365, +/-30) reaches
// as far back as 395 days, and 13 buckets (0..12) only cover to 390 days,
// leaving the window's oldest 5 days with no data and the rest resting on
// a small, noisy partial-bucket sample. A 14th baseline month covers the
// full 395-day reach with margin.
const BOOK_CUTOFF: IsoDate = addDays(cfg.asOf, -(MONTHS * BUCKET_DAYS)); // 14 x 30 = 420 -> asOf - 420

// 395 is the deepest date any intake query can reach — the Board's Year
// as-at window is (asOf-395, asOf-365] (TAD §L.4.2). Asserted, not
// assumed: if MONTHS or BUCKET_DAYS ever changes such that the cutoff
// rises above this line, generation fails loudly rather than silently
// reintroducing the contamination this floor exists to close.
if (BOOK_CUTOFF > addDays(cfg.asOf, -395)) {
  throw new Error(
    `generate-fixture: BOOK_CUTOFF (${BOOK_CUTOFF}) is not at or before asOf-395 ` +
    `(${addDays(cfg.asOf, -395)}). The Board's Year as-at query would reach into book ` +
    'territory. Increase MONTHS or BUCKET_DAYS so intakeBuckets * bucketDays >= 395.',
  );
}

function randomHistoricalBookDate(): IsoDate {
  // TAD §C.3, §D.1.2 (v1.5) — population membership is a pure date
  // predicate: book records fall in [bookCutoff - 5y, bookCutoff],
  // intake records in (bookCutoff, asOf]. Before v1.5 this had no floor,
  // and book records could — and did — land inside the intake windows.
  return addDays(BOOK_CUTOFF, -randInt(0, 5 * 365));
}

/** Spread `total` as evenly as possible across `buckets` non-negative integers summing to `total`. */
function distribute(total: number, buckets: number): number[] {
  const base = Math.floor(total / buckets);
  const remainder = total - base * buckets;
  return Array.from({ length: buckets }, (_, i) => base + (i < remainder ? 1 : 0));
}

// --- Reference IDs -----------------------------------------------------------

let refCounter = 1000;
function nextReference(): string {
  refCounter += 1;
  return `CUS-${String(refCounter).padStart(5, '0')}`;
}

// --- Country pools, verified against the ingested table at generation time --

const FOREIGN_NON_HIGH_RISK = ['Germany', 'Canada', 'Japan', 'Singapore', 'United Kingdom', 'France', 'Switzerland', 'Netherlands', 'Australia', 'Ireland'];
const HIGH_RISK = ['China', 'Nigeria', 'Panama', 'Vietnam', 'Kenya', 'United Arab Emirates', 'Thailand', 'Pakistan'];
const DOMESTIC = 'United States';

for (const c of FOREIGN_NON_HIGH_RISK) {
  if (jurisdictionBand(c) !== 'Medium') throw new Error(`fixture config error: '${c}' is not Medium-banded (got ${jurisdictionBand(c)})`);
}
for (const c of HIGH_RISK) {
  if (jurisdictionBand(c) !== 'High') throw new Error(`fixture config error: '${c}' is not High-banded (got ${jurisdictionBand(c)})`);
}
if (jurisdictionBand(DOMESTIC) !== 'Low') throw new Error('fixture config error: United States is not Low-banded');

// --- Industry pools (CRRM v2.3 §3.1) ----------------------------------------

const HIGH_INDUSTRY_NAICS = '522390'; // matches worked examples 7/8/9's own citation
const MEDIUM_INDUSTRY_NAICS_POOL = ['722511', '441110', '456110', '812930'];
const LOW_INDUSTRY_NAICS_POOL = ['444110', '455110', '459999', '449210'];

// --- Archetype builders ------------------------------------------------------
// Each returns source attributes only; reference, onboardedAt and
// businessLine are attached by the caller. Every archetype below is a
// direct descendant of a CRRM §7 worked example or DD §3's own named
// profile, so its rating is known in advance without hand-setting it —
// the engine still computes it from these attributes in the same pass.

type Archetype = () => Omit<CustomerSource, 'reference' | 'onboardedAt' | 'businessLine'>;

const retailLow: Archetype = () => ({
  entityType: 'Individual',
  naicsCode: null,
  product: 'DDA',
  country: DOMESTIC,
  tmAlertCount: 0,
  pepStatus: 'None',
});

// CRRM §8: "reaches the High band only by combining a high-risk
// jurisdiction, high-risk products, and alerting activity." Score 3.50
// (High) or 3.80 with a fuller alert count — both safely below Unacceptable.
const retailHigh: Archetype = () => ({
  entityType: 'Individual',
  naicsCode: null,
  product: pick(['Payment Clearing', 'International Wires'] as const),
  country: pick(HIGH_RISK),
  tmAlertCount: randInt(1, 4),
  pepStatus: 'None',
});

const commercialLow: Archetype = () => ({
  entityType: 'Listed Corporate',
  naicsCode: pick(LOW_INDUSTRY_NAICS_POOL),
  product: pick(['DDA', 'CD'] as const),
  country: DOMESTIC,
  tmAlertCount: 0,
  pepStatus: 'None',
});

const commercialMedium: Archetype = () => ({
  entityType: 'Non-Listed Corporate',
  naicsCode: pick(MEDIUM_INDUSTRY_NAICS_POOL),
  product: 'Lending',
  country: pick([...FOREIGN_NON_HIGH_RISK, DOMESTIC]),
  tmAlertCount: 0,
  pepStatus: 'None',
});

// Worked example 7's profile exactly: NLC / 522390 / payment clearing or
// intl wires / foreign non-high-risk / no alerts -> 3.60, High.
const commercialHighGeneric: Archetype = () => ({
  entityType: 'Non-Listed Corporate',
  naicsCode: HIGH_INDUSTRY_NAICS,
  product: pick(['Payment Clearing', 'International Wires'] as const),
  country: pick(FOREIGN_NON_HIGH_RISK),
  tmAlertCount: 0,
  pepStatus: 'None',
});

// DD §3's BaaS cluster (foreign leg): identical shape to commercialHighGeneric
// -- kept distinct for readability at the call sites that build the spike.
const baasForeign: Archetype = commercialHighGeneric;

// DD §3's BaaS cluster (domestic leg): same profile, domestic jurisdiction
// -> 3.00, Medium. This is the "3 Medium" of the 20-record cluster.
const baasDomestic: Archetype = () => ({
  entityType: 'Non-Listed Corporate',
  naicsCode: HIGH_INDUSTRY_NAICS,
  product: pick(['Payment Clearing', 'International Wires'] as const),
  country: DOMESTIC,
  tmAlertCount: 0,
  pepStatus: 'None',
});

// Worked example 6b's profile: NLC / High industry / lending / foreign
// non-high-risk / 5+ alerts -> 3.70, High. DD §3: "a High-tier industry
// corporate on lending in a foreign non-high-risk jurisdiction, scoring
// 3.10 clean and 3.70 with 5+ alerts."
const alertDrivenHigh: Archetype = () => ({
  entityType: 'Non-Listed Corporate',
  naicsCode: HIGH_INDUSTRY_NAICS,
  product: 'Lending',
  country: pick(FOREIGN_NON_HIGH_RISK),
  tmAlertCount: randInt(5, 9),
  pepStatus: 'None',
});

// Scores 2.70 (Medium) on its own -- a Senior Foreign PEP floors it to
// High, so this record's High rating visibly comes from the escalation
// route, not from score (DD-22).
const pepEscalationCommercial: Archetype = () => ({
  entityType: 'Non-Listed Corporate',
  naicsCode: pick(MEDIUM_INDUSTRY_NAICS_POOL),
  product: 'Lending',
  country: pick(FOREIGN_NON_HIGH_RISK),
  tmAlertCount: 0,
  pepStatus: 'Senior Foreign PEP',
});

const assetManagementLow: Archetype = () => ({
  entityType: 'Individual',
  naicsCode: null,
  product: 'DDA',
  country: DOMESTIC,
  tmAlertCount: 0,
  pepStatus: 'None',
});

const assetManagementHigh: Archetype = retailHigh; // same structural shape: individual, high jurisdiction + product + alerts

// A visibly-Low record placed in a high-risk jurisdiction purely to
// satisfy DD-21 ("at least one record in each population sits in the
// high-risk jurisdiction band") without disturbing any High count --
// score 2.20 regardless of which population it lands in.
const jurisdictionDemoLow: Archetype = () => ({
  entityType: 'Individual',
  naicsCode: null,
  product: 'DDA',
  country: pick(HIGH_RISK),
  tmAlertCount: 0,
  pepStatus: 'None',
});

// A Low-scoring record (1.00) carrying Domestic PEP status, floored to
// Medium -- the second half of DD-22, placed in the wider month population.
const domesticPepFlooredRetail: Archetype = () => ({
  entityType: 'Individual',
  naicsCode: null,
  product: 'DDA',
  country: DOMESTIC,
  tmAlertCount: 0,
  pepStatus: 'Domestic PEP',
});

// --- Record assembly ---------------------------------------------------------

function build(archetype: Archetype, businessLine: BusinessLine, onboardedAt: IsoDate): CustomerSource {
  return { reference: nextReference(), businessLine, onboardedAt, ...archetype() };
}

const sourceRecords: CustomerSource[] = [];

// --- The established book: 2,000 records, one shot, no monthly structure ---

function buildBookLine(
  businessLine: BusinessLine,
  total: number,
  highRate: number,
  lowArchetype: Archetype,
  highArchetype: Archetype,
  mediumArchetype: Archetype | null,
): void {
  const targetHigh = Math.round(total * highRate);
  for (let i = 0; i < targetHigh; i++) sourceRecords.push(build(highArchetype, businessLine, randomHistoricalBookDate()));
  const remaining = total - targetHigh;
  // A minority run Medium for realism where a Medium archetype exists
  // (Commercial); the rest are the clean Low filler.
  const mediumCount = mediumArchetype ? Math.round(remaining * 0.15) : 0;
  for (let i = 0; i < mediumCount; i++) sourceRecords.push(build(mediumArchetype as Archetype, businessLine, randomHistoricalBookDate()));
  for (let i = 0; i < remaining - mediumCount; i++) sourceRecords.push(build(lowArchetype, businessLine, randomHistoricalBookDate()));
}

const bookRetailTotal = Math.round(cfg.bookSize * cfg.bookSegmentShares.retailConsumer);
const bookCommercialTotal = Math.round(cfg.bookSize * cfg.bookSegmentShares.commercial);
const bookAssetMgmtTotal = cfg.bookSize - bookRetailTotal - bookCommercialTotal;

buildBookLine('retail-consumer', bookRetailTotal, cfg.bookLineHighRates.retailConsumer, retailLow, retailHigh, null);
buildBookLine('commercial', bookCommercialTotal, cfg.bookLineHighRates.commercial, commercialLow, commercialHighGeneric, commercialMedium);
buildBookLine('asset-management', bookAssetMgmtTotal, cfg.bookLineHighRates.assetManagement, assetManagementLow, assetManagementHigh, null);

const bookRecordCount = bookRetailTotal + bookCommercialTotal + bookAssetMgmtTotal;

// DD-21 (book): swap one Retail-book Low filler's country for a high-risk
// one, purely so the book carries at least one high-risk-jurisdiction
// record -- still scores Low (2.20), so no count above is disturbed.
{
  const bookSlice = sourceRecords.slice(0, bookRecordCount);
  const target = bookSlice.find((r) => r.businessLine === 'retail-consumer' && r.country === DOMESTIC);
  if (target) {
    const idx = sourceRecords.indexOf(target);
    sourceRecords[idx] = { ...target, ...jurisdictionDemoLow() };
  }
}

// --- Intake: 14 monthly buckets (monthsAgo 0..13), Retail/AM flat, ---------
// --- Commercial ramping per config -----------------------------------------
// (MONTHS is declared above, ahead of book generation — see BOOK_CUTOFF.)

let seniorForeignPepPlaced = false;

// Retail and Asset Management: distribute each line's TOTAL High target
// across all 13 months, rather than rounding volume*rate independently
// per month. At AM's small monthly volume (24), Math.round(24*0.06)=1
// every month systematically undershoots the intended 1.44/month average
// -- distributing the rounded total (19 across 13 months) avoids that
// compounding rounding error.
const retailHighByMonth = distribute(Math.round(cfg.historicMonthlyIntakeByLine.retailConsumer * MONTHS * cfg.bookLineHighRates.retailConsumer), MONTHS);
const amHighByMonth = distribute(Math.round(cfg.historicMonthlyIntakeByLine.assetManagement * MONTHS * cfg.bookLineHighRates.assetManagement), MONTHS);

for (let monthsAgo = 0; monthsAgo < MONTHS; monthsAgo++) {
  const monthEntries: { archetype: Archetype; businessLine: BusinessLine }[] = [];

  const retailVolume = cfg.historicMonthlyIntakeByLine.retailConsumer;
  const retailHighCount = retailHighByMonth[monthsAgo] ?? 0;
  for (let i = 0; i < retailHighCount; i++) monthEntries.push({ archetype: retailHigh, businessLine: 'retail-consumer' });
  for (let i = 0; i < retailVolume - retailHighCount; i++) monthEntries.push({ archetype: retailLow, businessLine: 'retail-consumer' });

  const amVolume = cfg.historicMonthlyIntakeByLine.assetManagement;
  const amHighCount = amHighByMonth[monthsAgo] ?? 0;
  for (let i = 0; i < amHighCount; i++) monthEntries.push({ archetype: assetManagementHigh, businessLine: 'asset-management' });
  for (let i = 0; i < amVolume - amHighCount; i++) monthEntries.push({ archetype: assetManagementLow, businessLine: 'asset-management' });

  const multiplier = cfg.commercialVolumeMultiplierByMonth[monthsAgo] ?? 1;
  const commercialVolume = Math.round(cfg.historicMonthlyIntakeByLine.commercial * multiplier);
  const commercialHighRate = cfg.commercialHighRateByMonth[monthsAgo] ?? cfg.bookLineHighRates.commercial;
  const commercialHighTarget = Math.round(commercialVolume * commercialHighRate);
  const baasShare = cfg.baasShareOfCommercialByMonth[monthsAgo] ?? 0;
  const baasTotal = Math.round(commercialVolume * baasShare);
  const baasHighCount = Math.round(baasTotal * cfg.baasForeignRate);
  const baasMediumCount = baasTotal - baasHighCount;

  let remainingHighTarget = commercialHighTarget - baasHighCount;
  const alertDrivenCount = Math.min(cfg.alertTailSize, Math.max(0, remainingHighTarget));
  remainingHighTarget -= alertDrivenCount;

  // DD-22, first half: exactly one designated PEP-escalation record, placed
  // in the present month's Commercial High population.
  const wantsPepEscalation = monthsAgo === 0 && !seniorForeignPepPlaced && cfg.pepPrevalenceByType.commercialHighMonthSeniorForeignPepCount > 0;
  const pepEscalationCount = wantsPepEscalation ? 1 : 0;
  if (wantsPepEscalation) seniorForeignPepPlaced = true;
  remainingHighTarget -= pepEscalationCount;

  const otherHighCount = Math.max(0, remainingHighTarget); // any residual High target beyond BaaS/alert-tail/PEP, generic profile
  const nonBaasNonAlertVolume = commercialVolume - baasTotal - alertDrivenCount - pepEscalationCount;
  const routineCount = Math.max(0, nonBaasNonAlertVolume - otherHighCount);

  for (let i = 0; i < baasHighCount; i++) monthEntries.push({ archetype: baasForeign, businessLine: 'commercial' });
  for (let i = 0; i < baasMediumCount; i++) monthEntries.push({ archetype: baasDomestic, businessLine: 'commercial' });
  for (let i = 0; i < alertDrivenCount; i++) monthEntries.push({ archetype: alertDrivenHigh, businessLine: 'commercial' });
  for (let i = 0; i < pepEscalationCount; i++) monthEntries.push({ archetype: pepEscalationCommercial, businessLine: 'commercial' });
  for (let i = 0; i < otherHighCount; i++) monthEntries.push({ archetype: commercialHighGeneric, businessLine: 'commercial' });
  const routineMediumCount = Math.round(routineCount * 0.35);
  for (let i = 0; i < routineMediumCount; i++) monthEntries.push({ archetype: commercialMedium, businessLine: 'commercial' });
  for (let i = 0; i < routineCount - routineMediumCount; i++) monthEntries.push({ archetype: commercialLow, businessLine: 'commercial' });

  for (const { item, onboardedAt } of assignSpreadDates(monthsAgo, monthEntries)) {
    sourceRecords.push(build(item.archetype, item.businessLine, onboardedAt));
  }
}

// DD-21 (month/quarter/year, nested): one high-risk-jurisdiction record in
// the present month, which by nesting also lands inside quarter and year.
sourceRecords.push(build(jurisdictionDemoLow, 'retail-consumer', randomDateInBucket(0)));

// DD-22, second half: one Domestic-PEP record floored Low -> Medium, in
// the wider month population.
if (cfg.pepPrevalenceByType.wideMonthDomesticPepFlooredCount > 0) {
  sourceRecords.push(build(domesticPepFlooredRetail, 'retail-consumer', randomDateInBucket(0)));
}

// --- Score every record with the real engine --------------------------------

const records: CustomerRecord[] = sourceRecords.map((s) => ({ ...s, ...score(s) }));

// Hard structural invariant (TAD §K.2.9): zero exceptions, checked before
// anything else runs, since a single violation here invalidates everything
// downstream regardless of how the population-level checks read.
const overLimit = records.filter((r) => r.score > 4.20);
if (overLimit.length > 0) {
  console.error(`FAIL generate-fixture: ${overLimit.length} onboarded record(s) score above 4.20 (K.2.9). First offender: ${JSON.stringify(overLimit[0])}`);
  process.exit(1);
}

// --- Validation report: DD §3's 22 checks -----------------------------------

interface DdCheckResult {
  id: string;
  description: string;
  pass: boolean; // for DD-9, always true — report-only
  reportOnly: boolean;
  detail: string;
}
const ddResults: DdCheckResult[] = [];
function ddRecord(id: string, description: string, pass: boolean, detail: string, reportOnly = false): void {
  ddResults.push({ id, description, pass, reportOnly, detail });
}

function inWindow(onboardedAt: IsoDate, windowAsOf: IsoDate, windowDays: number): boolean {
  return onboardedAt > addDays(windowAsOf, -windowDays) && onboardedAt <= windowAsOf;
}

const bookReferenceSet = new Set<string>(sourceRecords.slice(0, bookRecordCount).map((r) => r.reference));
function isIntakeRecord(r: CustomerRecord): boolean {
  return !bookReferenceSet.has(r.reference);
}

// Module (trailing window): asOf is always the snapshot's asOf; only the window widens.
function moduleSlice(businessLine: BusinessLine | null, windowDays: number): CustomerRecord[] {
  return records.filter(
    (r) => isIntakeRecord(r) && inWindow(r.onboardedAt, cfg.asOf, windowDays) && (businessLine === null || r.businessLine === businessLine),
  );
}
// Board (as-at): asOf moves by offset; window is always 30.
function boardSlice(offsetDays: number): CustomerRecord[] {
  const at = addDays(cfg.asOf, -offsetDays);
  return records.filter((r) => isIntakeRecord(r) && inWindow(r.onboardedAt, at, 30));
}

function highShare(pop: readonly CustomerRecord[]): number {
  if (pop.length === 0) return 0;
  return pop.filter((r) => r.rating === 'High').length / pop.length;
}
function within(actual: number, target: number, tolerance: number): boolean {
  return Math.abs(actual - target) <= tolerance + 1e-9;
}
function pct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}

const book = records.filter((r) => bookReferenceSet.has(r.reference));

// TAD §D.1.2 (v1.5) — enforced at generation: every record falls in
// [BOOK_CUTOFF - 5y, BOOK_CUTOFF] (book) or (BOOK_CUTOFF, asOf] (intake),
// disjoint and exhaustive, and the deepest intake reach (the Board's Year
// as-at window) returns nothing on or before BOOK_CUTOFF.
{
  const misplacedBook = book.filter((r) => r.onboardedAt > BOOK_CUTOFF);
  const misplacedIntake = records.filter((r) => !bookReferenceSet.has(r.reference) && r.onboardedAt <= BOOK_CUTOFF);
  if (misplacedBook.length > 0 || misplacedIntake.length > 0) {
    throw new Error(
      `generate-fixture: book/intake partition violated — ${misplacedBook.length} book record(s) ` +
      `dated after BOOK_CUTOFF, ${misplacedIntake.length} intake record(s) dated on or before it. ` +
      'First offender: ' + JSON.stringify(misplacedBook[0] ?? misplacedIntake[0]),
    );
  }
  const yearWindowStart = addDays(cfg.asOf, -395);
  const yearWindowEnd = addDays(cfg.asOf, -365);
  const contaminated = records.filter(
    (r) => r.onboardedAt > yearWindowStart && r.onboardedAt <= yearWindowEnd && r.onboardedAt <= BOOK_CUTOFF,
  );
  if (contaminated.length > 0) {
    throw new Error(
      `generate-fixture: ${contaminated.length} record(s) at or before BOOK_CUTOFF fall inside the ` +
      `Board's Year as-at window (${yearWindowStart}, ${yearWindowEnd}] — exactly the contamination the floor exists to close.`,
    );
  }
}

const bookByLine = {
  'retail-consumer': book.filter((r) => r.businessLine === 'retail-consumer'),
  commercial: book.filter((r) => r.businessLine === 'commercial'),
  'asset-management': book.filter((r) => r.businessLine === 'asset-management'),
};

// --- Engine conformance: DD-1..3 (already the phase 2 engine gate, TAD-12..14) --
ddRecord('DD-1', 'All twelve worked examples reproduce exactly', true, 'Verified by check.ts TAD-12 (engine gate), not re-verified here.');
ddRecord('DD-2', 'Band boundaries verified at 2.40 / 3.40 / 4.20 / 4.40', true, 'Verified by check.ts TAD-13.');
ddRecord('DD-3', 'The PEP override behaves as a floor, never a ceiling', true, 'Verified by check.ts TAD-14.');

// --- Population targets: DD-4..8a -------------------------------------------
const bookHighShare = highShare(book);
ddRecord(
  'DD-4',
  'Book High 4.8% ±0.5pp, with per-line rates',
  within(bookHighShare, 0.048, 0.005) &&
    within(highShare(bookByLine['retail-consumer']), 0.008, 0.004) &&
    within(highShare(bookByLine.commercial), 0.125, 0.015) &&
    within(highShare(bookByLine['asset-management']), 0.06, 0.01),
  `book=${pct(bookHighShare)} retail=${pct(highShare(bookByLine['retail-consumer']))} commercial=${pct(highShare(bookByLine.commercial))} assetMgmt=${pct(highShare(bookByLine['asset-management']))}`,
);

const moduleMonth = moduleSlice(null, 30);
const moduleMonthShare = highShare(moduleMonth);
ddRecord('DD-5', 'Module month aggregate 11.0% ±1pp', within(moduleMonthShare, 0.11, 0.01), `${pct(moduleMonthShare)} (${moduleMonth.length} records)`);

const moduleQuarter = moduleSlice(null, 90);
const moduleYear = moduleSlice(null, 365);
const moduleQuarterShare = highShare(moduleQuarter);
const moduleYearShare = highShare(moduleYear);
ddRecord(
  'DD-6',
  'Module quarter ~9.1% ±1pp, module year ~6.0% ±0.6pp',
  within(moduleQuarterShare, 0.091, 0.01) && within(moduleYearShare, 0.06, 0.006),
  `quarter=${pct(moduleQuarterShare)} (${moduleQuarter.length}) year=${pct(moduleYearShare)} (${moduleYear.length})`,
);

const boardMonth = boardSlice(0);
const boardQuarter = boardSlice(90);
const boardYear = boardSlice(365);
const boardMonthShare = highShare(boardMonth);
const boardQuarterShare = highShare(boardQuarter);
const boardYearShare = highShare(boardYear);
ddRecord(
  'DD-6a',
  'Board as-at figures: quarter ~6.3% ±0.7pp, year ~4.8% ±0.5pp',
  within(boardQuarterShare, 0.063, 0.007) && within(boardYearShare, 0.048, 0.005),
  `board-month=${pct(boardMonthShare)} board-quarter=${pct(boardQuarterShare)} (${boardQuarter.length}) board-year=${pct(boardYearShare)} (${boardYear.length})`,
);

const moduleCommercialMonth = moduleSlice('commercial', 30);
const commercialMonthShare = highShare(moduleCommercialMonth);
ddRecord('DD-7', 'Commercial month 50% ±5pp', within(commercialMonthShare, 0.5, 0.05), `${pct(commercialMonthShare)} (${moduleCommercialMonth.length} records)`);

const retailYear = moduleSlice('retail-consumer', 365);
const amYear = moduleSlice('asset-management', 365);
ddRecord(
  'DD-8',
  'Retail and Asset Management hold historic volumes and stay within ±1pp of book rates',
  within(highShare(retailYear), 0.008, 0.01) && within(highShare(amYear), 0.06, 0.01),
  `retail-year=${pct(highShare(retailYear))} (${retailYear.length}) am-year=${pct(highShare(amYear))} (${amYear.length})`,
);

const preRampMonthsAgoList = Array.from({ length: MONTHS }, (_, i) => i).filter((m) => m >= 5);
const preRamp = records.filter(
  (r) => isIntakeRecord(r) && preRampMonthsAgoList.some((m) => inWindow(r.onboardedAt, addDays(cfg.asOf, -30 * m), 30)),
);
const preRampShare = highShare(preRamp);
ddRecord('DD-8a', 'Pre-ramp intake aggregate lands at the book rate, 4.8% ±0.5pp', within(preRampShare, 0.048, 0.005), `${pct(preRampShare)} (${preRamp.length} records)`);

const bookMediumShare = book.length === 0 ? 0 : book.filter((r) => r.rating === 'Medium').length / book.length;
const bookLowShare = book.length === 0 ? 0 : book.filter((r) => r.rating === 'Low').length / book.length;
ddRecord('DD-9', 'Book Medium/Low shares recorded as derived output (not gated)', true, `Medium=${pct(bookMediumShare)} Low=${pct(bookLowShare)}`, true);

// --- Structural integrity: DD-10..15 ----------------------------------------
ddRecord('DD-10', 'No onboarded record scores above 4.20', overLimit.length === 0, `max score observed: ${Math.max(...records.map((r) => r.score))}`);

const monthHighCount = moduleMonth.filter((r) => r.rating === 'High').length;
const quarterHighCount = moduleQuarter.filter((r) => r.rating === 'High').length;
const yearHighCount = moduleYear.filter((r) => r.rating === 'High').length;
const nestOk =
  moduleMonth.length <= moduleQuarter.length && moduleQuarter.length <= moduleYear.length && monthHighCount <= quarterHighCount && quarterHighCount <= yearHighCount;
ddRecord(
  'DD-11',
  'Nesting holds (month ⊂ quarter ⊂ year) and High counts nest',
  nestOk,
  `month=${moduleMonth.length}(${monthHighCount}) quarter=${moduleQuarter.length}(${quarterHighCount}) year=${moduleYear.length}(${yearHighCount})`,
);

const lineHighCounts = (['retail-consumer', 'commercial', 'asset-management'] as const).map((bl) => moduleSlice(bl, 30).filter((r) => r.rating === 'High').length);
const lineWeightOk = lineHighCounts.reduce((a, b) => a + b, 0) === monthHighCount;
ddRecord('DD-12', 'Business-line High counts weight to the aggregate, per horizon', lineWeightOk, `lines sum to ${lineHighCounts.reduce((a, b) => a + b, 0)}, aggregate is ${monthHighCount}`);

ddRecord('DD-13', 'Every derived field is engine-computed, never present in source data', true, "Enforced by CustomerSource/CustomerDerived type separation and score()'s source-only input type.");

const noNames = records.every((r) => typeof r.reference === 'string' && r.reference.startsWith('CUS-'));
const uniqueRefCount = new Set(records.map((r) => r.reference)).size;
ddRecord('DD-14', 'No customer name field populated, every record carries a unique reference', noNames && uniqueRefCount === records.length, `${records.length} records, ${uniqueRefCount} unique references`);

ddRecord('DD-15', "Every record's jurisdiction band is resolved from the Basel reference table at scoring time and never carried in source data", true, "CustomerSource has no band field; score() resolves it via jurisdictionBand() on every call.");

// --- Narrative legibility: DD-16..22 ----------------------------------------
const commercialHighMonth = moduleCommercialMonth.filter((r) => r.rating === 'High');
const naics522390Share = commercialHighMonth.length === 0 ? 0 : commercialHighMonth.filter((r) => r.naicsCode === HIGH_INDUSTRY_NAICS).length / commercialHighMonth.length;
ddRecord('DD-16', 'Commercial High population at month is ≥80% NAICS 522390', naics522390Share >= 0.8, `${pct(naics522390Share)} of ${commercialHighMonth.length}`);

const alertDrivenCountObserved = commercialHighMonth.filter((r) => r.tmAlertCount >= 5).length;
ddRecord('DD-17', 'Between 2 and 4 Commercial High records are alert-driven', alertDrivenCountObserved >= 2 && alertDrivenCountObserved <= 4, `${alertDrivenCountObserved} alert-driven`);

ddRecord('DD-18', 'Commercial / High / Month returns 20 ±3 records', within(commercialHighMonth.length, 20, 3), `${commercialHighMonth.length} records`);

ddRecord(
  'DD-19',
  'The horizon progression is monotonic: month > quarter > year on aggregate High share',
  moduleMonthShare > moduleQuarterShare && moduleQuarterShare > moduleYearShare,
  `month=${pct(moduleMonthShare)} quarter=${pct(moduleQuarterShare)} year=${pct(moduleYearShare)}`,
);

const rampMonthShares = [4, 3, 2, 1, 0].map((m) => {
  const pop = records.filter((r) => isIntakeRecord(r) && r.businessLine === 'commercial' && inWindow(r.onboardedAt, addDays(cfg.asOf, -30 * m), 30));
  return highShare(pop);
});
const rampMonotonic = rampMonthShares.every((v, i) => i === 0 || v >= rampMonthShares[i - 1]! - 1e-9);
ddRecord('DD-20', 'The ramp is monotonic month by month across the five-month onset', rampMonotonic, `Commercial monthly High rate, oldest->newest: ${rampMonthShares.map(pct).join(' -> ')}`);

const populationsForDd21: [string, CustomerRecord[]][] = [
  ['book', book],
  ['intake-month', moduleMonth],
  ['intake-quarter', moduleQuarter],
  ['intake-year', moduleYear],
];
const dd21Offenders = populationsForDd21.filter(([, pop]) => !pop.some((r) => jurisdictionBand(r.country) === 'High'));
ddRecord('DD-21', 'At least one record in each population sits in the high-risk jurisdiction band', dd21Offenders.length === 0, dd21Offenders.length === 0 ? 'present in all four' : `missing in: ${dd21Offenders.map(([n]) => n).join(', ')}`);

const seniorForeignPepInCommercialHighMonth = commercialHighMonth.some((r) => r.pepStatus === 'Senior Foreign PEP' && r.route === 'PEP escalation');
const domesticPepFlooredInMonth = moduleMonth.some((r) => r.pepStatus === 'Domestic PEP' && r.route === 'PEP escalation' && r.rating === 'Medium');
ddRecord(
  'DD-22',
  'The PEP override is visibly exercised: a Senior Foreign PEP escalation in Commercial High/month, and a Domestic PEP floored to Medium in the wider month population',
  seniorForeignPepInCommercialHighMonth && domesticPepFlooredInMonth,
  `senior-foreign-in-commercial-high-month=${seniorForeignPepInCommercialHighMonth} domestic-floored-in-month=${domesticPepFlooredInMonth}`,
);

// --- Report and exit ---------------------------------------------------------

console.log('\n=== generate-fixture: DD §3 validation report ===\n');
let allBinaryPass = true;
for (const r of ddResults) {
  const mark = r.reportOnly ? 'INFO' : r.pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${r.id} — ${r.description}`);
  console.log(`       ${r.detail}`);
  if (!r.reportOnly && !r.pass) allBinaryPass = false;
}
const binaryTotal = ddResults.filter((r) => !r.reportOnly).length;
const binaryPassed = ddResults.filter((r) => !r.reportOnly && r.pass).length;
console.log(`\n${binaryPassed}/${binaryTotal} binary checks passed (DD-9 is report-only).`);

// --- Emit ---------------------------------------------------------------------

const output = {
  meta: {
    asOf: cfg.asOf,
    generatedAt: new Date().toISOString().slice(0, 10),
    randomSeed: cfg.randomSeed,
    bookCutoff: BOOK_CUTOFF,
    jurisdictionSource: { source: 'Basel AML Index, Public Edition', edition: '2025', accessed: '2026-08-20', threshold: '> 5.00' },
  },
  records,
};
writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
console.log(`\nWrote ${records.length} records (${book.length} book, ${records.length - book.length} intake) to ${OUTPUT_PATH.replace(ROOT + '/', '')}`);

if (!allBinaryPass) {
  console.error('\nFAIL generate-fixture: one or more binary DD checks failed.');
  process.exit(1);
}
