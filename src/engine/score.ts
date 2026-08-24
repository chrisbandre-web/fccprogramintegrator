// TAD §D.2.2 — takes one customer's source attributes and returns its
// points, score, rating, route and fired factors. Pure; no state; called
// ~4,850 times at startup (§D.2.2's Lifecycle note).

import type { CustomerSource, CustomerDerived, Rating } from '../data/types.ts';
import {
  entityTypePoints,
  productPoints,
  tmAlertPoints,
  computeScore,
  ratingFromScore,
  applyPepFloor,
} from './methodology.ts';
import { industryBand } from './reference/industries.ts';
import { jurisdictionBand } from './reference/jurisdictions.ts';

const BAND_POINTS: Record<'High' | 'Medium' | 'Low', 1 | 3 | 5> = { High: 5, Medium: 3, Low: 1 };

/**
 * §D.2.2's three enforced properties:
 *  1. Takes source attributes only — a caller cannot pass a pre-set band
 *     or rating (enforced by the `CustomerSource` parameter type; there is
 *     no overload that accepts a `CustomerRecord`).
 *  2. The jurisdiction and industry bands are resolved inside, from
 *     country and NAICS code — never accepted as input.
 *  3. `rating` is the higher of `scoredRating` and `pepFloor(pep)`, with
 *     `route` recording which produced it. The override is a floor, never
 *     a ceiling (CRRM §6).
 */
export function score(customer: CustomerSource): CustomerDerived {
  const entityType = entityTypePoints(customer.entityType);
  const industry = industryBand(customer.naicsCode); // already a 1|3|5 point value
  const product = productPoints(customer.product);
  const jurisdiction = BAND_POINTS[jurisdictionBand(customer.country)]; // 'High'|'Medium'|'Low' -> points
  const tmAlerts = tmAlertPoints(customer.tmAlertCount);

  const points = { entityType, industry, product, jurisdiction, tmAlerts };
  const scoreValue = computeScore(points);
  const scoredRating = ratingFromScore(scoreValue);
  const { rating, route } = applyPepFloor(scoredRating, customer.pepStatus);
  const firedFactors = firedFactorNames(points);

  return { points, score: scoreValue, scoredRating, rating, route, firedFactors };
}

/**
 * DD §5: "'Which factors fired' is carried by the cells themselves — a 5
 * is a fired factor." `firedFactors` names each attribute (§3's own
 * casing) whose point value reached the High band.
 */
function firedFactorNames(points: {
  entityType: 1 | 3 | 5;
  industry: 1 | 3 | 5;
  product: 1 | 3 | 5;
  jurisdiction: 1 | 3 | 5;
  tmAlerts: 1 | 3 | 5;
}): readonly string[] {
  const names: string[] = [];
  if (points.entityType === 5) names.push('Entity Type');
  if (points.industry === 5) names.push('Industry');
  if (points.product === 5) names.push('Product Availability');
  if (points.jurisdiction === 5) names.push('Jurisdiction');
  if (points.tmAlerts === 5) names.push('TM Alerts');
  return names;
}

// Re-exported so callers needing the union without importing methodology.ts
// directly have one place to get it from; not part of the TAD's specified
// export list but harmless and avoids a second import for a type alias.
export type { Rating };
