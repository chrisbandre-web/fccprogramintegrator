// TAD §D.4.4 — gives the Board the same declared surface a module has, so
// the frame can render legends uniformly by kind and never branch on
// "is this the board."
import type { ByHorizon, ContextDeclaration } from './types.ts';

// TouchTwo Amendment 2, DD Appendix A.4 (confirmed 25 Aug 2026) — supersedes
// the construction-time compressions ("Today"/"T-90"/"T-365"). Header reads
// "Time Period — As at" on the Board, T-notation with "Days" spelled out.
// Board reads "as at" (a point in time, offset from today); the module
// (when active) reads its own trailing-window wording, headed "Trailing" —
// structurally distinct wording, not just different values, so the two
// contexts can never be collapsed by accident.
const boardHorizonLegend: ByHorizon<string> = {
  month: 'Today',
  quarter: 'T - 90 Days',
  year: 'T - 365 Days',
};

export const boardContext: ContextDeclaration = {
  id: 'board',
  horizonLegend: boardHorizonLegend,
  horizonQualifier: 'As at',
  legend: [
    {
      kind: 'health-and-trend',
      label: 'Business Risk',
      markMeans: 'the amount of business risk present',
      arrowMeans: 'the direction the metric is moving',
    },
    {
      kind: 'health-and-trend',
      // Reverted 23 Aug 2026 (Chris, second pass): "Control Risk" is the
      // final, consistent label — the parallelism with "Business Risk"
      // (both two words) was the deciding argument, and the Design System
      // owner deferred to it ("your call and I'll take it," accurate
      // either way). This supersedes the "Control Effectiveness Risk"
      // change made earlier the same day from the owner's first note.
      label: 'Control Risk',
      markMeans:
        'how close the control is to allowing the risk exposure it was specifically designed to prevent',
      arrowMeans: 'the direction the metric is moving',
    },
  ],
};
