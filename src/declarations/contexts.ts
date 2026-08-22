// TAD §D.4.4 — gives the Board the same declared surface a module has, so
// the frame can render legends uniformly by kind and never branch on
// "is this the board."
import type { ByHorizon, ContextDeclaration } from './types.ts';

// DD §2's two horizon wordings — deliberately structurally different so
// they cannot be collapsed by accident. Board reads "as at" (a point in
// time, offset from today); the module (when active) reads its own
// trailing-window wording. Copy from the Coordinator, 22 Aug 2026: Board
// Month reads "Today" (offset 0) while Quarter/Year read "T-90"/"T-365" —
// which happen to numerically coincide with the module's own window
// lengths at Quarter and Year, but diverge at Month, where the module's
// trailing window is 30 days rather than "today."
const boardHorizonLegend: ByHorizon<string> = {
  month: 'Today',
  quarter: 'T-90',
  year: 'T-365',
};

export const boardContext: ContextDeclaration = {
  id: 'board',
  horizonLegend: boardHorizonLegend,
  legend: [
    {
      kind: 'health-and-trend',
      label: 'Business Risk',
      markMeans: 'the amount of business risk present',
      arrowMeans: 'the direction the metric is moving',
    },
    {
      kind: 'health-and-trend',
      label: 'Control Risk',
      markMeans:
        'how close the control is to allowing the risk exposure it was specifically designed to prevent',
      arrowMeans: 'the direction the metric is moving',
    },
  ],
};
