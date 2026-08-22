// TAD §C.1 — bands are shell data, not module data. Declares the two
// regions, their labels, their order, and which presentation they draw in.
import type { BandId } from '../declarations/types.ts';

export interface Band {
  readonly id: BandId;
  readonly label: string;
  readonly order: number;
  readonly presentation: 'tile' | 'registerRow';
}

export const bands: readonly Band[] = [
  { id: 'business-risk', label: 'Business Risk', order: 0, presentation: 'tile' },
  { id: 'program-elements', label: 'Program Elements', order: 1, presentation: 'registerRow' },
] as const;
