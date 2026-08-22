// TAD §D.6.2–D.6.11 build the Comparison and the Records drill-down in
// phases 4 and 5. This is a minimal, honest placeholder so the live tile
// is clickable and safe in phase 1 rather than dead or broken — not an
// attempt to satisfy any later phase's exit conditions early.
export function CustomerIntakeModule(): JSX.Element {
  return (
    <div style={{ padding: 'var(--space-4)', color: 'var(--ink-secondary)' }}>
      <p>Customer Intake detail — Comparison and Records ship in phases 4–5.</p>
    </div>
  );
}
