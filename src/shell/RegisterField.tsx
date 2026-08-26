import type { Horizon } from '../data/types.ts';
import type { ModuleDeclaration } from '../declarations/types.ts';
import { RegisterRow } from './RegisterRow.tsx';

// TAD §D.5.16, §L.4.5 — "Walk the declarations in order; pack up to
// three elements per row; start a new row when placement.group differs
// from the previous element's." The shell never names or counts a
// group; it only compares each element's group to the previous one.
//
// REVERTED, 26 Aug 2026 (Coordinator ruling, overriding the 23 August
// Coordinator ruling that had introduced a single-element merge
// exception at the Data/Governance boundary): the Coordinator now
// prefers the orphan (Recordkeeping alone on its own row) over having
// Risk Appetite Statement sit apart from Board Reporting and Risk
// Committee Reporting, which the exception had produced. This is a
// deliberate second reversal of an explicit "a future Engineer should
// not fix it back" instruction — see TAD §D.5.16's amended Design Note
// for the full history. Back to the strict break, no exception.
function packIntoRows(declarations: readonly ModuleDeclaration[]): {
  row: ModuleDeclaration[];
  freshGroup: boolean;
}[] {
  const rows: { row: ModuleDeclaration[]; freshGroup: boolean }[] = [];
  let previousGroup: string | null | undefined = undefined;

  for (const d of declarations) {
    const currentRow = rows[rows.length - 1];
    const groupChanged = d.placement.group !== previousGroup;
    const rowIsFull = currentRow && currentRow.row.length >= 3;

    if (!currentRow || groupChanged || rowIsFull) {
      rows.push({ row: [d], freshGroup: groupChanged });
    } else {
      currentRow.row.push(d);
    }
    previousGroup = d.placement.group;
  }

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
