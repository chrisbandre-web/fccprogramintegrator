// TAD §D.2.5 — carries CRRM v2.3 §7's twelve worked examples as data:
// profile, expected points in attribute order, expected score, expected
// override, expected rating. Consumed by the phase 2 binary gate and by
// `check.ts` on every run thereafter. All twelve must reproduce exactly or
// phase 2 does not exit — "eleven of twelve" is a failure (§D.2.5).
//
// Representative countries stand in for CRRM §7's descriptive profiles
// ("domestic" / "foreign non-high-risk" / "high-risk jurisdiction"), since
// the examples name profiles, not countries. Chosen against the ingested
// table (§D.1.1b): United States (Low, by identity), Germany (4.97 ->
// Medium, foreign non-high-risk), China (7.26 -> High). A NAICS code
// stands in for each named industry tier the same way: an industry-High
// code (522390, matching example 7's own explicit citation of it) and an
// industry-Low code (444110, Home Centers) for the examples that need
// "Low industry" without naming one. Example 4 names its own code
// (restaurant, 722511, Medium).

import type { CustomerSource, Rating } from '../data/types.ts';

export interface WorkedExample {
  readonly id: string; // '1' .. '12', '6a', '6b' per CRRM §7's own numbering
  readonly profile: string; // CRRM §7's profile description, verbatim
  readonly customer: CustomerSource;
  /** Points in attribute order: Entity / Industry / Product / Jurisdiction / TM Alerts. */
  readonly expectedPoints: readonly [1 | 3 | 5, 1 | 3 | 5, 1 | 3 | 5, 1 | 3 | 5, 1 | 3 | 5];
  readonly expectedScore: number;
  readonly expectedOverride: 'Medium floor' | 'High floor' | null;
  readonly expectedRating: Rating | 'Unacceptable';
  readonly pins: string; // CRRM §7's "What it pins" column, verbatim
}

function customer(overrides: Partial<CustomerSource> & Pick<CustomerSource, 'reference'>): CustomerSource {
  return {
    entityType: 'Individual',
    naicsCode: null,
    product: 'DDA',
    country: 'United States',
    tmAlertCount: 0,
    pepStatus: 'None',
    businessLine: 'commercial',
    onboardedAt: '2026-01-01',
    ...overrides,
  };
}

export const WORKED_EXAMPLES: readonly WorkedExample[] = [
  {
    id: '1',
    profile: 'Individual · domestic · DDA · no alerts',
    customer: customer({ reference: 'WE-01' }),
    expectedPoints: [1, 1, 1, 1, 1],
    expectedScore: 1.00,
    expectedOverride: null,
    expectedRating: 'Low',
    pins: 'The model floor.',
  },
  {
    id: '2',
    profile: 'Non-listed corporate · Low industry · lending · domestic · no alerts',
    customer: customer({
      reference: 'WE-02',
      entityType: 'Non-Listed Corporate',
      naicsCode: '444110', // Home Centers — §3.1 Low
      product: 'Lending',
    }),
    expectedPoints: [3, 1, 3, 1, 1],
    expectedScore: 1.70,
    expectedOverride: null,
    expectedRating: 'Low',
    pins: 'A routine domestic commercial customer.',
  },
  {
    id: '3',
    profile: 'Individual · foreign non-high-risk · lending · 1–4 alerts',
    customer: customer({
      reference: 'WE-03',
      product: 'Lending',
      country: 'Germany', // 4.97 -> Medium, foreign non-high-risk
      tmAlertCount: 2, // 1-4 -> Medium
    }),
    expectedPoints: [1, 1, 3, 3, 3],
    expectedScore: 2.40,
    expectedOverride: null,
    expectedRating: 'Low',
    pins: 'Boundary: 2.40 is Low, not Medium.',
  },
  {
    id: '4',
    profile: 'Non-listed corporate · Medium industry (restaurant) · lending · domestic · 5+ alerts',
    customer: customer({
      reference: 'WE-04',
      entityType: 'Non-Listed Corporate',
      naicsCode: '722511', // Full-Service Restaurants — §3.1 Medium
      product: 'Lending',
      tmAlertCount: 5,
    }),
    expectedPoints: [3, 3, 3, 1, 5],
    expectedScore: 2.70,
    expectedOverride: null,
    expectedRating: 'Medium',
    pins: 'A cash-intensive domestic business is Low until it alerts. Pins the Medium industry tier.',
  },
  {
    id: '5',
    profile: 'Non-listed corporate · Low industry · intl wires · foreign non-high-risk · 5+ alerts',
    customer: customer({
      reference: 'WE-05',
      entityType: 'Non-Listed Corporate',
      naicsCode: '444110', // Home Centers — §3.1 Low
      product: 'International Wires',
      country: 'Germany',
      tmAlertCount: 5,
    }),
    expectedPoints: [3, 1, 5, 3, 5],
    expectedScore: 3.40,
    expectedOverride: null,
    expectedRating: 'Medium',
    pins: 'Boundary: 3.40 is Medium, not High.',
  },
  {
    id: '6a',
    profile: 'Non-listed corporate · High industry · lending · foreign non-high-risk · no alerts',
    customer: customer({
      reference: 'WE-06A',
      entityType: 'Non-Listed Corporate',
      naicsCode: '522390', // §3.1 High
      product: 'Lending',
      country: 'Germany',
    }),
    expectedPoints: [3, 5, 3, 3, 1],
    expectedScore: 3.10,
    expectedOverride: null,
    expectedRating: 'Medium',
    pins: 'Paired with 6b to isolate the effect of alerts.',
  },
  {
    id: '6b',
    profile: 'As 6a, with 5+ alerts',
    customer: customer({
      reference: 'WE-06B',
      entityType: 'Non-Listed Corporate',
      naicsCode: '522390',
      product: 'Lending',
      country: 'Germany',
      tmAlertCount: 5,
    }),
    expectedPoints: [3, 5, 3, 3, 5],
    expectedScore: 3.70,
    expectedOverride: null,
    expectedRating: 'High',
    pins: 'Alert-driven High: the structural attributes are unchanged.',
  },
  {
    id: '7',
    profile: 'Non-listed corporate · High industry (522390) · payment clearing · foreign non-high-risk · no alerts',
    customer: customer({
      reference: 'WE-07',
      entityType: 'Non-Listed Corporate',
      naicsCode: '522390',
      product: 'Payment Clearing',
      country: 'Germany',
    }),
    expectedPoints: [3, 5, 5, 3, 1],
    expectedScore: 3.60,
    expectedOverride: null,
    expectedRating: 'High',
    pins: 'Intake-driven High with no PEP flag and no alerts — the case v1.0 could not produce at all.',
  },
  {
    id: '8',
    profile: 'As 7, in a high-risk jurisdiction',
    customer: customer({
      reference: 'WE-08',
      entityType: 'Non-Listed Corporate',
      naicsCode: '522390',
      product: 'Payment Clearing',
      country: 'China', // 7.26 -> High
    }),
    expectedPoints: [3, 5, 5, 5, 1],
    expectedScore: 4.20,
    expectedOverride: null,
    expectedRating: 'High',
    pins: 'Boundary, and the maximum onboardable score.',
  },
  {
    id: '9',
    profile: 'Trust · High industry · payment clearing · high-risk jurisdiction · no alerts',
    customer: customer({
      reference: 'WE-09',
      entityType: 'Trust',
      naicsCode: '522390',
      product: 'Payment Clearing',
      country: 'China',
    }),
    expectedPoints: [5, 5, 5, 5, 1],
    expectedScore: 4.40,
    expectedOverride: null,
    expectedRating: 'Unacceptable',
    pins: 'Not onboarded. Entity type alone separates this from example 8.',
  },
  {
    id: '10',
    profile: 'Individual · domestic · DDA · no alerts · domestic PEP',
    customer: customer({ reference: 'WE-10', pepStatus: 'Domestic PEP' }),
    expectedPoints: [1, 1, 1, 1, 1],
    expectedScore: 1.00,
    expectedOverride: 'Medium floor',
    expectedRating: 'Medium',
    pins: 'Override raises the rating from Low.',
  },
  {
    id: '11',
    profile: 'As 6b, with domestic PEP',
    customer: customer({
      reference: 'WE-11',
      entityType: 'Non-Listed Corporate',
      naicsCode: '522390',
      product: 'Lending',
      country: 'Germany',
      tmAlertCount: 5,
      pepStatus: 'Domestic PEP',
    }),
    expectedPoints: [3, 5, 3, 3, 5],
    expectedScore: 3.70,
    expectedOverride: null, // "—": the floor is silent, the scored rating is already higher
    expectedRating: 'High',
    pins: 'The floor is silent: the scored rating is already higher.',
  },
  {
    id: '12',
    profile: 'Individual · domestic · DDA · no alerts · senior foreign PEP',
    customer: customer({ reference: 'WE-12', pepStatus: 'Senior Foreign PEP' }),
    expectedPoints: [1, 1, 1, 1, 1],
    expectedScore: 1.00,
    expectedOverride: 'High floor',
    expectedRating: 'High',
    pins: 'High by escalation, not by score.',
  },
];
