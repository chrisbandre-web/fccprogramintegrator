import type { CustomerRecord } from '../../data/types.ts';
import { industryDescription } from '../../data/industryDescription.ts';

// TAD §D.6.9 — eleven columns in DD §5's order. Band and points share a
// cell per attribute ("Description (points)"), so the arithmetic reads
// across the row rather than between two blocks; a point value of 5 is
// bolded into ink-primary, since "a 5 is a fired factor" is carried by
// the cells themselves (DD §5) and needs no separate column. Attribute
// WEIGHTS (the methodology's fixed multipliers) never appear — only the
// per-record point values, which vary row to row and are what let a
// reader verify the Score column by eye.
function PointCell({ value, points }: { value: string; points: 1 | 3 | 5 }): JSX.Element {
  const fired = points === 5;
  return (
    <span className="truncate-text">
      {value}{' '}
      <span
        style={{
          font: `var(${fired ? '--weight-semibold' : '--weight-regular'}) var(--type-table) / var(--leading-tight) var(--font-family)`,
          color: fired ? 'var(--ink-primary)' : 'var(--ink-tertiary)',
        }}
      >
        ({points})
      </span>
    </span>
  );
}

const cellStyle = {
  font: 'var(--weight-regular) var(--type-table) / var(--leading-tight) var(--font-family)',
  color: 'var(--ink-primary)',
} as const;

function RecordRow({ record }: { record: CustomerRecord }): JSX.Element {
  return (
    <tr>
      <td style={cellStyle}>{record.reference}</td>
      {/* The redaction treatment — a greyed field with no display text
          (§D.6.9). There is no customer name in this data model at all;
          the cell exists to show what a real deployment would redact,
          not to hide a value this fixture actually has. */}
      <td>
        <span style={{ display: 'inline-block', width: '100%', height: '1em', background: 'var(--surface-edge)', borderRadius: 2 }} />
      </td>
      <td style={cellStyle}>
        <PointCell value={record.entityType} points={record.points.entityType} />
      </td>
      <td style={cellStyle}>
        <PointCell
          value={`${industryDescription(record.naicsCode)}${record.naicsCode ? ` (${record.naicsCode})` : ''}`}
          points={record.points.industry}
        />
      </td>
      <td style={cellStyle}>
        <PointCell value={record.product} points={record.points.product} />
      </td>
      <td style={cellStyle}>
        <PointCell value={record.country} points={record.points.jurisdiction} />
      </td>
      <td style={cellStyle}>
        <PointCell value={String(record.tmAlertCount)} points={record.points.tmAlerts} />
      </td>
      <td style={cellStyle}>{record.score.toFixed(2)}</td>
      <td>
        {/* Tint on the word, never a wash behind it — nothing else on
            this surface takes colour (§D.6.9). */}
        <span
          style={{
            font: 'var(--weight-semibold) var(--type-table) / var(--leading-tight) var(--font-family)',
            color:
              record.rating === 'High' || record.rating === 'Unacceptable'
                ? 'var(--risk-text-high)'
                : record.rating === 'Medium'
                  ? 'var(--risk-text-medium)'
                  : 'var(--risk-text-low)',
          }}
        >
          {record.rating}
        </span>
      </td>
      <td style={cellStyle}>{record.route === 'PEP escalation' ? 'PEP escalation' : 'On score'}</td>
      <td style={cellStyle}>{record.pepStatus}</td>
    </tr>
  );
}

const HEADERS = [
  'Reference', 'Customer', 'Entity type', 'Industry', 'Product', 'Jurisdiction', 'TM alerts', 'Score', 'Rating', 'Route', 'PEP',
];

// TAD §D.6.9 — rows are display-only, not focusable; the table is not a
// scroll region (the panel's own page slice, from selectors.ts, bounds
// row count to at most 25).
export function RecordTable({ records }: { records: readonly CustomerRecord[] }): JSX.Element {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {HEADERS.map((h) => (
            <th
              key={h}
              style={{
                textAlign: 'left',
                font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)',
                color: 'var(--ink-tertiary)',
                borderBottom: '1px solid var(--surface-edge)',
                padding: '4px 8px 4px 0',
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <RecordRow record={r} key={r.reference} />
        ))}
      </tbody>
    </table>
  );
}
