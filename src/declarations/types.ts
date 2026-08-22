// TAD §D.4.1 — SEED CONTRACT (the shape). No artifact may alter this file
// without a Coordinator-approved amendment to the TAD (§K.1).
import type { ComponentType } from 'react';
import type { Horizon, Rating } from '../data/types.ts';
import type { DeclarationSchema } from './schema.ts';

export type ByHorizon<T> = { readonly month: T; readonly quarter: T; readonly year: T };

export interface HeroValue {
  readonly value: number;
  readonly unit: Unit;
}

export type Unit = '%' | 'count' | 'Days';
export type TrendValue = 'Increasing' | 'Stable' | 'Decreasing';
export type BandId = 'business-risk' | 'program-elements';

export interface ComputeContext {
  readonly horizon: Horizon;
  // The data-access interface (§C.3) is injected here in phase 3 (§J.3).
  // Phase 1's live-tile resolvers ignore this context entirely and return
  // DD §3's stubbed figures (TAD §D.6.1, "the phase 1 stub").
}

export type HeroSlot =
  | { readonly kind: 'authored'; readonly value: number | string; readonly unit: string }
  | { readonly kind: 'computed'; readonly resolve: (c: ComputeContext) => HeroValue }
  | { readonly kind: 'absent' };

export type TrendSlot =
  | { readonly kind: 'authored'; readonly value: TrendValue }
  | { readonly kind: 'computed'; readonly resolve: (c: ComputeContext) => TrendValue }
  | { readonly kind: 'absent' };

export type HealthSlot =
  | { readonly kind: 'authored'; readonly value: 'Red' | 'Amber' | 'Green' }
  | { readonly kind: 'absent' };

export interface ElementContent {
  readonly title: string;
  readonly metricHeader: string | null;
  readonly hero: HeroSlot;
  readonly trend: TrendSlot;
  readonly health: HealthSlot;
  readonly feedCaption: string;
}

export interface RegulatoryAlignment {
  readonly document: string;
  readonly citation: string;
}

export type LegendEntry =
  | { kind: 'health-and-trend'; label: string; markMeans: string; arrowMeans: string }
  | { kind: 'rating-ramp'; label: string; steps: readonly { rating: Rating; label: string }[] };

export interface ModuleDeclaration {
  readonly id: string;
  readonly status: 'live' | 'inactive';
  readonly placement: { readonly band: BandId; readonly group: string | null; readonly order: number };
  readonly content: ByHorizon<ElementContent>;
  readonly legend: readonly LegendEntry[];
  /** The module's own trailing-window wording (DD §2), distinct from the
   *  Board's as-at wording in ContextDeclaration. Only meaningful for
   *  status:'live' modules — inactive declarations never become the
   *  active context, so this is unused for them (empty ByHorizon of ''). */
  readonly horizonLegend: ByHorizon<string>;
  readonly schema: DeclarationSchema;
  readonly alignment?: RegulatoryAlignment;
  readonly surface?: ComponentType; // live modules only
}

export interface ContextDeclaration {
  readonly id: string; // 'board' or a module id
  readonly horizonLegend: ByHorizon<string>;
  readonly legend: readonly LegendEntry[];
}
