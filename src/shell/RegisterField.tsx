import type { Horizon } from '../data/types.ts';
import type { ModuleDeclaration } from '../declarations/types.ts';
import { RegisterRow } from './RegisterRow.tsx';

// TAD §D.5.16, §L.4.5 — "Walk the declarations in order; pack up to
// three elements per row; start a new row when placement.group differs
// from the previous element's, EXCEPT WHERE THE OUTGOING GROUP'S
// REMAINDER IS A SINGLE ELEMENT, in which case that element shares its
// row with the opening of the next group." The shell never names or
// counts a group; it only compares each element's group to the previous
// one, and tracks how many are pending from a not-yet-flushed cluster.
//
// FOUND AND FIXED, 26 Aug 2026, before the phase 3-5 handoff: this
// function never actually implemented the exception — only the strict
// break — even though §D.5.16's Design Note has called it Coordinator-
// approved since 23 August and said explicitly "a future Engineer should
// not fix it back." The row COUNT happened to still read as 10 either
// way (masking the defect at a glance), but rows 9-10's CONTENT was
// wrong: Recordkeeping alone, then Risk Appetite Statement grouped with
// Board/Risk Committee Reporting — not the enumerated table's Recordkeeping
// + Risk Appetite Statement (row 9) / Board + Risk Committee Reporting
// (row 10). Verified against §L.4.5's table exactly after this fix.
function packIntoRows(declarations: readonly ModuleDeclaration[]): {
  row: ModuleDeclaration[];
  freshGroup: boolean;
}[] {
  // First pass: cluster consecutive same-group elements, preserving order.
  const clusters: { group: string | null | undefined; items: ModuleDeclaration[] }[] = [];
  for (const d of declarations) {
    const last = clusters[clusters.length - 1];
    if (!last || last.group !== d.placement.group) {
      clusters.push({ group: d.placement.group, items: [d] });
    } else {
      last.items.push(d);
    }
  }

  const rows: { row: ModuleDeclaration[]; freshGroup: boolean }[] = [];
  let pending: ModuleDeclaration[] = []; // 0 or 1 elements carried from the previous cluster's remainder

  clusters.forEach((cluster, i) => {
    const remaining = [...cluster.items];
    let firstRowOfCluster = true;

    if (pending.length > 0) {
      // The pending single shares its row with exactly the OPENING
      // element of the next group — one, not "as many as fit." Verified
      // against §L.4.5's table: taking more than one here produces a
      // full 3-element row 9 and an orphaned single-element row 10,
      // which is a different wrong arrangement than the one this fix
      // replaces, not the specified one.
      const take = remaining.splice(0, 1);
      rows.push({ row: [...pending, ...take], freshGroup: true });
      pending = [];
      firstRowOfCluster = false;
    }

    while (remaining.length > 3) {
      rows.push({ row: remaining.splice(0, 3), freshGroup: firstRowOfCluster });
      firstRowOfCluster = false;
    }

    const isLastCluster = i === clusters.length - 1;
    if (remaining.length === 1 && !isLastCluster) {
      pending = remaining; // carry forward — this is the exception
    } else if (remaining.length > 0) {
      rows.push({ row: remaining, freshGroup: firstRowOfCluster });
    }
  });

  // A trailing single with no next group to share with is flushed as its
  // own row rather than dropped — the exception only applies mid-registry.
  if (pending.length > 0) rows.push({ row: pending, freshGroup: false });

  return rows;
}

export function RegisterField({
  declarations,
  horizon,
}: {
  declarations: readonly ModuleDeclaration[];
  horizon: Horizon;
}): JSX.Element {
  const rows = packIntoRows(declarations);

  return (
    <div className="register-field">
      {rows.map(({ row, freshGroup }, i) => (
        <div className="register-field__row" data-fresh-group={freshGroup} key={i}>
          {row.map((d) => (
            <RegisterRow key={d.id} id={d.id} content={d.content[horizon]} />
          ))}
        </div>
      ))}
    </div>
  );
}
