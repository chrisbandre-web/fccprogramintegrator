// TAD §D.4.4 — gives the Board the same declared surface a module has, so
// the frame can render legends uniformly by kind and never branch on
// "is this the board."
import type { ByHorizon, ContextDeclaration } from './types.ts';

// DD §2's two horizon wordings — deliberately structurally different so
// they cannot be collapsed by accident. Board reads "as at"; the module
// (when active) reads its own trailing-window wording (declared alongside
// the module itself, TAD §D.6.1).
const boardHorizonLegend: ByHorizon<string> = {
  month: 'As at today',
  quarter: 'As at 90 days ago',
  year: 'As at 365 days ago',
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
