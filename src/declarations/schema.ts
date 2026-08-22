// TAD §C.2 — SEED CONTRACT. The schema is data. Rejected: a thirteen-field
// interface; a Record keyed by a label union — both make renaming a row a
// type change, which is exactly the failure this file exists to prevent.

export interface RequirementRow {
  readonly id: string; // stable key
  readonly label: string; // the row's name, renameable by a deployment
  readonly content: string | null; // null = declared and unpopulated
}

export type DeclarationSchema = readonly RequirementRow[];

// Labels carried verbatim from the Marketing Pack (16 Aug 2026).
export const DEFAULT_SCHEMA_ROW_LABELS = [
  'Risk Appetite',
  'Governance',
  'Control Process',
  'Process Inputs / Outputs',
  'Roles & Responsibilities',
  'Metrics',
  'Reporting Channels / Frequency',
  'Independent Testing',
  'Effectiveness Documentation',
  'Data Sourcing',
  'Data Governance',
  'Model & Non-Model Tools',
  'Model & Non-Model Tools Testing and Governance',
] as const;

export const defaultSchema = (): DeclarationSchema =>
  DEFAULT_SCHEMA_ROW_LABELS.map((label, i) => ({ id: `row-${i + 1}`, label, content: null }));
