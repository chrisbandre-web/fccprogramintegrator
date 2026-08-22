import type { Horizon } from '../data/types.ts';
import type { ModuleDeclaration } from '../declarations/types.ts';
import { RegisterRow } from './RegisterRow.tsx';

// TAD §D.5.16, §L.4.5 — "Walk the declarations in order; whenever
// placement.group differs from the previous element's, start a new row;
// pack up to three elements per row." The shell never names or counts a
// group; it only compares each element's group to the previous one.
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
            <RegisterRow key={d.id} content={d.content[horizon]} />
          ))}
        </div>
      ))}
    </div>
  );
}
