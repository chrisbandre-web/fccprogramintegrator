// TAD §H.4 — "One file, every knob, no knob anywhere else." DD §3 is the
// source for every figure below; each constant cites the DD table or note
// it derives from. Retail and Asset Management volumes are held constant
// and never tuned to make an aggregate land (§H.4, §DD's "the mix is an
// output" note) — only Commercial's multiplier and BaaS share move.
//
// Months are indexed by `monthsAgo`, 0 (present) through 13: a fixed
// 30-day bucket per index, `(asOf - 30*(monthsAgo+1), asOf - 30*monthsAgo]`
// (TAD §L.4.1's day-window convention). 14 buckets rather than 12 so the
// Board's Year reading — `asOf` offset 365 days, window 30 (§L.4.2) — has
// full 30-day coverage even though 365 isn't a multiple of 30 (the window
// straddles the tail of bucket 13 and the head of bucket 12); DD §3's
// "~2,850" year total assumed roughly 12 months, so this fixture's year population
// runs slightly larger, which is the honest consequence of covering the
// full range the Board's own query semantics require rather than a tuned
// figure (recorded here since it's a knob-adjacent judgement call, not a
// documented DD number).

export const bookSize = 2000; // DD §3, "established customer book — 2,000 records"

export const bookSegmentShares = {
  retailConsumer: 0.60,
  commercial: 0.30,
  assetManagement: 0.10,
} as const; // DD §3's book segment table

export const bookLineHighRates = {
  retailConsumer: 0.008,
  commercial: 0.125,
  assetManagement: 0.06,
} as const; // DD §3's book "Target High" column, and the historic per-line rate the intake baseline reproduces (DD §3's "the baseline now equals the book" note)

export const historicMonthlyIntakeByLine = {
  retailConsumer: 144,
  commercial: 72,
  assetManagement: 24,
} as const; // DD §3, "Historic monthly intake is 240 records at the book's own mix." Held constant for Retail and Asset Management across every month.

// Commercial's volume as a multiplier against historicMonthlyIntakeByLine.commercial,
// indexed by monthsAgo 0..12. Ramp months 0-4 carry DD §3's own ramp-table
// volumes (40,44,50,58,64); baseline months 5-12 hold at 1.0 (DD §3: "12 →
// 5... 72 (baseline)"). Present month (index 0) is DD §3's exact 40.
export const commercialVolumeMultiplierByMonth: readonly number[] = [
  40 / 72, // 0 — present
  44 / 72, // 1
  50 / 72, // 2
  58 / 72, // 3
  64 / 72, // 4
  1, 1, 1, 1, 1, 1, 1, 1, // 5..12 — baseline
];

// Commercial's High rate per month, indexed the same way — DD §3's ramp
// table (12.5% baseline; 15/20/28/38/50% for months 4/3/2/1/present).
export const commercialHighRateByMonth: readonly number[] = [
  0.50, // 0 — present
  0.38, // 1
  0.28, // 2
  0.20, // 3
  0.15, // 4
  0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, // 5..12 — baseline
];

// The BaaS cluster's share of Commercial's High-rated volume at the
// present month (DD §3's Commercial-spike table: 20 of 40 Commercial
// records, 17 High + 3 Medium, against 3 alert-driven High and 1 PEP-
// escalation High from the remaining 20 — see the generator's own
// comment for the exact month-0 split this produces). Earlier ramp
// months scale the BaaS share down proportionally as the programme
// "begins roughly five months before the present and accelerates" (DD
// §3); baseline months carry none, since the programme hasn't begun.
export const baasShareOfCommercialByMonth: readonly number[] = [
  0.50, // 0 — present: 20 of 40
  17 / 44, // 1
  14 / 50, // 2
  12 / 58, // 3
  10 / 64, // 4
  0, 0, 0, 0, 0, 0, 0, 0, // 5..12 — pre-programme
];

/** Of the BaaS cluster, the foreign (High-scoring) share; the remainder is domestic (Medium). DD §3: "17 High, 3 Medium" of 20 -> 0.85. */
export const baasForeignRate = 0.85;

/** DD §3's "Other Commercial — alert-driven" cluster size at the present month: 3 records, each CRRM worked example 6b's profile (3.10 clean, 3.70 with 5+ alerts). */
export const alertTailSize = 3;

/**
 * DD-22's two required, visibly-exercised PEP routes. Not a probability
 * model — these are exact counts of designated records, since DD-22 asks
 * for specific, findable examples in the Records surface, not a
 * statistical prevalence.
 */
export const pepPrevalenceByType = {
  /** At least one Commercial High-at-month record whose rating comes from the Senior Foreign PEP floor, not from score (DD-22, first half). */
  commercialHighMonthSeniorForeignPepCount: 1,
  /** At least one record in the wider month population whose rating is floored from Low to Medium by Domestic PEP status (DD-22, second half). */
  wideMonthDomesticPepFlooredCount: 1,
} as const;

/**
 * TAD §C.4: "the fixture draws countries from a closed vocabulary — the
 * 177 table entries plus any deliberately-unlisted jurisdictions named
 * here." Empty: every country this fixture uses is drawn from the
 * ingested 177-row table (src/engine/reference/jurisdictions.ts), so no
 * additional unlisted jurisdiction is needed.
 */
export const deliberatelyUnlistedJurisdictions: readonly string[] = [];

export const randomSeed = 20260821; // seeds the fixture's PRNG (mulberry32); determinism per TAD §I.4

/** The fixture's frozen "today," written into SnapshotMeta.asOf and never `new Date()` (TAD §L.4.1). */
export const asOf = '2026-08-24';
