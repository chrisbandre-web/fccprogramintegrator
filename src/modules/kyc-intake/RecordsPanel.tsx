import type { BusinessLine } from '../../data/types.ts';

// TAD §D.6.8 builds the real Records surface — eleven columns, redaction,
// the rating filter, pagination, the four record states — in phase 5.
// This is a minimal, honest placeholder so a line selection has somewhere
// real to land in phase 4 rather than a dead click, following the same
// convention CustomerIntakeModule.tsx used in phase 1. Deleted in phase
// 5, not left behind.
export function RecordsPanel({ selectedLine }: { selectedLine: 'book' | BusinessLine }): JSX.Element {
  const label = selectedLine === 'book' ? 'the whole book' : selectedLine;
  return (
    <div style={{ padding: 'var(--space-4)', color: 'var(--ink-secondary)' }}>
      <p>Records for {label} — the record table, redaction, filter and pagination ship in phase 5.</p>
    </div>
  );
}
