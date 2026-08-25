// TAD §D.6.1 — merges the generated board content for "customers" (title,
// metric header, feed caption, per-horizon health — all authored, from the
// Appendix B workbooks) with the module's own capabilities (computed hero
// and trend). Phase 3 (§J.3) replaces the phase 1 stub's constant
// resolvers with real data-access queries; the declaration's shape is
// unchanged, which is the whole point of the stub having existed.
import { loadLiveElementSource } from '../../declarations/load.ts';
import type { ComputeContext, ElementContent, ModuleDeclaration } from '../../declarations/types.ts';
import { defaultSchema } from '../../declarations/schema.ts';
import { asAtHighShare } from './selectors.ts';
import { customerIntakeAlignment } from './alignment.ts';
import { CustomerIntakeModule } from './CustomerIntakeModule.tsx';

const source = loadLiveElementSource('customers');

// TAD §L.4.2 — the Board's as-at reading: asOf offset {0, 90, 365} days,
// window always 30.
const BOARD_OFFSET_DAYS: Record<ComputeContext['horizon'], number> = {
  month: 0,
  quarter: 90,
  year: 365,
};

// TAD §L.4.1's verbatim day-arithmetic helper.
const addDays = (d: string, n: number): string => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};

function boardAsOf(horizon: ComputeContext['horizon'], today: string): string {
  return addDays(today, -BOARD_OFFSET_DAYS[horizon]);
}

function buildElementContent(horizon: ComputeContext['horizon']): ElementContent {
  const authored = source.content[horizon];
  return {
    title: authored.title,
    metricHeader: authored.metricHeader,
    hero: {
      kind: 'computed' as const,
      // TAD §D.6.1: hero.resolve({horizon, data}) returns the Board's
      // as-at High share, queried at asOf = today − {0,90,365} with
      // windowDays: 30 — not the module's trailing-window aggregate.
      resolve: ({ data }: ComputeContext) => {
        const today = data.meta().asOf;
        return { value: asAtHighShare(data, boardAsOf(horizon, today)), unit: '%' as const };
      },
    },
    trend: {
      kind: 'computed' as const,
      // TAD §D.6.1: trend.resolve compares that figure against the same
      // query one period earlier. The Board's window is always 30 days
      // (§L.4.2), so "one period earlier" is the immediately preceding
      // 30-day window — asOf shifted back another 30 days at the same
      // windowDays. No epsilon is specified anywhere in the TAD for what
      // counts as "no material change," so this uses a strict inequality
      // (matching the strict-inequality convention already established
      // for band boundaries, TAD-13): equal reads Stable, not an
      // arbitrarily-chosen "close enough" band. Recorded as a decision
      // within remit (Playbook, "What the Engineer decides alone").
      resolve: ({ data }: ComputeContext): 'Increasing' | 'Stable' | 'Decreasing' => {
        const today = data.meta().asOf;
        const current = asAtHighShare(data, boardAsOf(horizon, today));
        const prior = asAtHighShare(data, addDays(boardAsOf(horizon, today), -30));
        if (current > prior) return 'Increasing';
        if (current < prior) return 'Decreasing';
        return 'Stable';
      },
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
      // TouchTwo Amendment 2 §6 — build defect, not a design change: the
      // Comparison anchors High at the left (confirmed against
      // CompositionBar.tsx's actual render order), and the legend must
      // read the same order to teach it correctly rather than backwards.
      // The document was already correct (v0.9.5 §12); this is the fix.
      steps: [
        { rating: 'High', label: 'High' },
        { rating: 'Medium', label: 'Medium' },
        { rating: 'Low', label: 'Low' },
      ],
    },
  ],
  // TouchTwo Amendment 2, DD Appendix A.4 (confirmed 25 Aug 2026) —
  // supersedes the construction-time "T-30/T-90/T-365" compression.
  // Headed "Trailing", structurally distinct from the Board's "As at"
  // wording, T-notation with "Days" spelled out.
  horizonLegend: {
    month: 'T - 30 Days',
    quarter: 'T - 90 Days',
    year: 'T - 365 Days',
  },
  horizonQualifier: 'Trailing',
  schema: defaultSchema(),
  // TAD §D.6.7 — the traceability moment. Declared here, not hardcoded in
  // MethodologyLabel, so a second module carries its own without editing
  // that component.
  alignment: customerIntakeAlignment,
  surface: CustomerIntakeModule,
};
