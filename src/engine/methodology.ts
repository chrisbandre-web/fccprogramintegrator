// TAD §D.2.1 — carries the Methodology's constants and band functions
// verbatim: attribute weights, point bands, rating thresholds, and the PEP
// floor table. No value here is configurable; the weights and thresholds
// are canonical and a knob over them would be a rule change wearing a
// configuration hat (TAD §D.2.1).
//
// Source: Customer Risk Rating Methodology v2.3, APPROVED 21 August 2026.
// Attribute and band names are carried verbatim from CRRM v2.3 in its own
// casing (§3's attribute table) so a practitioner reading the code and the
// document sees the same strings.

import type { Rating } from '../data/types.ts';

// --- §3 — weights, total 100% -----------------------------------------

export const WEIGHTS = {
  'Entity Type': 0.10,
  Industry: 0.20,
  'Product Availability': 0.25,
  Jurisdiction: 0.30,
  'TM Alerts': 0.15,
} as const;

export type MethodologyAttribute = keyof typeof WEIGHTS;

// --- §3 — Entity Type bands ---------------------------------------------

export type EntityType = 'Individual' | 'Listed Corporate' | 'Non-Listed Corporate' | 'Trust' | 'PHC';

export function entityTypePoints(entityType: EntityType): 1 | 3 | 5 {
  switch (entityType) {
    case 'Trust':
    case 'PHC':
      return 5;
    case 'Non-Listed Corporate':
      return 3;
    case 'Individual':
    case 'Listed Corporate':
      return 1;
  }
}

// --- §3 — Product Availability bands -------------------------------------

export type Product =
  | 'DDA' | 'CD'
  | 'Lending' | 'Structured Finance'
  | 'Payment Clearing' | 'International Wires' | 'Trade Finance' | 'Complex Structured Products';

export function productPoints(product: Product): 1 | 3 | 5 {
  switch (product) {
    case 'Payment Clearing':
    case 'International Wires':
    case 'Trade Finance':
    case 'Complex Structured Products':
      return 5;
    case 'Lending':
    case 'Structured Finance':
      return 3;
    case 'DDA':
    case 'CD':
      return 1;
  }
}

// --- §3 — TM Alerts bands -------------------------------------------------

/** §3: High = 5 or more alerts in the past 6 months · Medium = 1–4 · Low = none. */
export function tmAlertPoints(tmAlertCount: number): 1 | 3 | 5 {
  if (tmAlertCount >= 5) return 5;
  if (tmAlertCount >= 1) return 3;
  return 1;
}

// --- §5 — scoring formula and rating bands --------------------------------

/**
 * score = (0.10 × EntityType) + (0.20 × Industry) + (0.25 × Product)
 *       + (0.30 × Jurisdiction) + (0.15 × TMAlerts)
 * Each term is the attribute's point value of 1, 3, or 5.
 */
export function computeScore(points: {
  entityType: 1 | 3 | 5;
  industry: 1 | 3 | 5;
  product: 1 | 3 | 5;
  jurisdiction: 1 | 3 | 5;
  tmAlerts: 1 | 3 | 5;
}): number {
  const raw =
    WEIGHTS['Entity Type'] * points.entityType +
    WEIGHTS.Industry * points.industry +
    WEIGHTS['Product Availability'] * points.product +
    WEIGHTS.Jurisdiction * points.jurisdiction +
    WEIGHTS['TM Alerts'] * points.tmAlerts;
  // Round to the same two-decimal grain the worked examples and the record
  // table are expressed in (§L.4.6: "scores always two decimals"), so a
  // floating-point remainder (e.g. 3.4000000000000004) never causes a
  // strict-inequality boundary check to disagree with the printed value.
  return Math.round(raw * 100) / 100;
}

/**
 * §5 rating bands, strict inequalities throughout (§5's "Band boundaries"
 * note, and CRRM v1.1's source clarification): a boundary value sits in the
 * lower-risk band; anything strictly above it tips up.
 *   > 4.20              Unacceptable
 *   > 3.40 and <= 4.20  High
 *   > 2.40 and <= 3.40  Medium
 *   <= 2.40             Low
 */
export function ratingFromScore(score: number): Rating | 'Unacceptable' {
  if (score > 4.20) return 'Unacceptable';
  if (score > 3.40) return 'High';
  if (score > 2.40) return 'Medium';
  return 'Low';
}

// --- §6 — PEP override, a floor never a ceiling ---------------------------

export type PepStatus = 'None' | 'Domestic PEP' | 'Senior Foreign PEP';

/** §6: Senior Foreign PEP -> High floor · Domestic PEP -> Medium floor · None -> no floor. */
export function pepFloor(pepStatus: PepStatus): Rating | null {
  switch (pepStatus) {
    case 'Senior Foreign PEP':
      return 'High';
    case 'Domestic PEP':
      return 'Medium';
    case 'None':
      return null;
  }
}

/** Ordering used only to compare a scored rating against a PEP floor (§6: "the higher of the two"). Unacceptable is not reachable by the floor, but is ranked highest for correctness against a scored 'Unacceptable'. */
const RATING_RANK: Record<Rating | 'Unacceptable', number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Unacceptable: 3,
};

/**
 * §6: "The final rating is the higher of the scored rating and the override
 * floor... The override raises a rating; it never caps one." Returns the
 * final rating and whether the floor was the operative cause (§7 "Override"
 * column / TAD §D.2.2's `route`).
 */
export function applyPepFloor(
  scoredRating: Rating | 'Unacceptable',
  pepStatus: PepStatus,
): { rating: Rating | 'Unacceptable'; route: 'on score' | 'PEP escalation' } {
  const floor = pepFloor(pepStatus);
  if (floor === null) return { rating: scoredRating, route: 'on score' };
  if (RATING_RANK[floor] > RATING_RANK[scoredRating]) {
    return { rating: floor, route: 'PEP escalation' };
  }
  return { rating: scoredRating, route: 'on score' };
}
