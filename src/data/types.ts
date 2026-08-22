// TAD §C.3, §D.3.1 — type-only module. No runtime code, so nothing can
// import behaviour from it by accident. The interface itself
// (dataAccess.ts), its implementation (fixtureDataAccess.ts) and the
// composition-root loader (snapshot.ts) are built in phase 3 (§J.3); the
// shell needs these shared vocabulary types from phase 1 on.

export type Horizon = 'month' | 'quarter' | 'year';

export type Population = 'book' | 'intake';
export type BusinessLine = 'retail-consumer' | 'commercial' | 'asset-management';
export type Rating = 'Low' | 'Medium' | 'High';

export type IsoDate = string; // 'YYYY-MM-DD'

export interface CustomerQuery {
  readonly population: Population;
  /** The date the window is measured back from. Defaults to the snapshot's asOf. */
  readonly asOf?: IsoDate;
  /** Trailing window length in days. Intake only; ignored for the book. */
  readonly windowDays?: number;
  readonly businessLine?: BusinessLine;
  readonly rating?: Rating;
}

export interface SnapshotMeta {
  readonly asOf: IsoDate;
  readonly generatedAt: IsoDate;
  readonly randomSeed: number;
  readonly jurisdictionSource: { source: string; edition: string; accessed: IsoDate; threshold: string };
}

// Engine-facing types (§D.2.2, §D.3.1). Defined here rather than in the
// engine because the data layer, not the engine, owns "what a record is";
// the engine consumes CustomerSource and returns the derived fields below.
export interface CustomerSource {
  readonly reference: string; // e.g. 'CUS-04471'
  readonly entityType: 'Individual' | 'Listed Corporate' | 'Non-Listed Corporate' | 'Trust' | 'PHC';
  readonly naicsCode: string | null; // null for Individuals
  readonly product:
    | 'DDA' | 'CD'
    | 'Lending' | 'Structured Finance'
    | 'Payment Clearing' | 'International Wires' | 'Trade Finance' | 'Complex Structured Products';
  readonly country: string;
  readonly tmAlertCount: number;
  readonly pepStatus: 'None' | 'Domestic PEP' | 'Senior Foreign PEP';
  readonly businessLine: BusinessLine;
  readonly onboardedAt: IsoDate;
}

export interface CustomerDerived {
  readonly points: {
    readonly entityType: 1 | 3 | 5;
    readonly industry: 1 | 3 | 5;
    readonly product: 1 | 3 | 5;
    readonly jurisdiction: 1 | 3 | 5;
    readonly tmAlerts: 1 | 3 | 5;
  };
  readonly score: number;
  readonly scoredRating: Rating | 'Unacceptable';
  readonly rating: Rating | 'Unacceptable';
  readonly route: 'on score' | 'PEP escalation';
  readonly firedFactors: readonly string[];
}

export type CustomerRecord = CustomerSource & CustomerDerived;
