// TAD §D.6.1 — merges the generated board content for "customers" (title,
// metric header, feed caption, per-horizon health — all authored, from the
// Appendix B workbooks) with the module's own capabilities (computed hero
// and trend).
//
// PHASE 1 STUB (§D.6.1, Implementation Note): phase 1 ships a full board
// before the engine exists (§J.1). hero.resolve / trend.resolve are
// implemented here as constants returning DD §3's figures. The
// declaration's *shape* is final — ComputeContext is already threaded
// through, ignored for now — so phase 3 replaces only the resolver bodies
// with real data-access queries. This file is deleted in phase 3, not left
// behind; its replacement keeps the same export name and shape.
import { loadLiveElementSource } from '../../declarations/load.ts';
import type { ComputeContext, ElementContent, ModuleDeclaration } from '../../declarations/types.ts';
import { defaultSchema } from '../../declarations/schema.ts';

const source = loadLiveElementSource('customers');

// DD §3 — the Board's as-at figures. Month agrees with the module's own
// trailing-window aggregate (11.0%); Quarter and Year diverge by design —
// this is the Board's number set, not the module's (Reviewer F-23,
// BLOCKING; see D.6.1's Implementation Note above).
const BOARD_AS_AT: Record<ComputeContext['horizon'], number> = {
  month: 11.0,
  quarter: 6.3,
  year: 4.8,
};

// Stub trend direction. Not yet a real period-over-period comparison
// (that's phase 3) — Month and Quarter read Increasing because both sit
// above the prior anchor in DD §3's table; Year is the earliest anchor in
// the three-point stub and has nothing earlier to compare against, so it
// reads Stable ("a year ago intake was reproducing the book exactly," DD
// §3). Recorded as an Author judgment call, not a TAD-specified value.
const STUB_TREND: Record<ComputeContext['horizon'], 'Increasing' | 'Stable' | 'Decreasing'> = {
  month: 'Increasing',
  quarter: 'Increasing',
  year: 'Stable',
};

function buildElementContent(horizon: ComputeContext['horizon']): ElementContent {
  const authored = source.content[horizon];
  return {
    title: authored.title,
    metricHeader: authored.metricHeader,
    hero: {
      kind: 'computed' as const,
      resolve: (_c: ComputeContext) => ({ value: BOARD_AS_AT[horizon], unit: '%' as const }),
    },
    trend: {
      kind: 'computed' as const,
      resolve: (_c: ComputeContext) => STUB_TREND[horizon],
    },
    // Health is authored, per horizon (DD §3, Reviewer F-03) — passed
    // through verbatim from the generated declaration, never computed.
    health: authored.health.kind === 'authored' ? authored.health : { kind: 'absent' as const },
    feedCaption: authored.feedCaption,
  };
}

export const customerIntakeModule: ModuleDeclaration = {
  id: 'customers',
  status: 'live',
  placement: { band: 'business-risk', group: null, order: 0 },
  content: {
    month: buildElementContent('month'),
    quarter: buildElementContent('quarter'),
    year: buildElementContent('year'),
  },
  legend: [
    {
      kind: 'rating-ramp',
      label: 'Customer Risk Rating',
      steps: [
        { rating: 'Low', label: 'Low' },
        { rating: 'Medium', label: 'Medium' },
        { rating: 'High', label: 'High' },
      ],
    },
  ],
  schema: defaultSchema(),
};
