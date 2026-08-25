import type { RegulatoryAlignment } from '../../declarations/types.ts';

// TAD §D.6.7 — the traceability moment. Citation carried verbatim from
// CRRM §1's regulatory basis (Playbook: canonical inputs are never
// paraphrased). Kept in its own module, not inline in declaration.ts,
// so CustomerIntakeModule.tsx can import it directly rather than
// importing declaration.ts (which imports CustomerIntakeModule.tsx for
// its `surface` field) — avoiding a circular import between the two.
export const customerIntakeAlignment: RegulatoryAlignment = {
  document: 'Customer Risk Rating Methodology',
  citation:
    "FFIEC BSA/AML Examination Manual, Assessing Compliance with BSA Regulatory Requirements — Customer Due Diligence (CRRM §1)",
};
