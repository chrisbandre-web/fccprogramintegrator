const HEALTH_TOKEN: Record<'Red' | 'Amber' | 'Green', string> = {
  Red: 'var(--status-red)',
  Amber: 'var(--status-amber)',
  Green: 'var(--status-green)',
};

const HEALTH_LABEL: Record<'Red' | 'Amber' | 'Green', string> = {
  Red: 'Red — attention required',
  Amber: 'Amber — monitor',
  Green: 'Green — within appetite',
};

// TAD — a solid dot, --mark-size, coloured by the status token. Absence is
// handled by the caller not rendering it, never by rendering a neutral mark.
export function HealthMark({ value }: { value: 'Red' | 'Amber' | 'Green' }): JSX.Element {
  return (
    <span
      role="img"
      aria-label={HEALTH_LABEL[value]}
      style={{
        display: 'inline-block',
        width: 'var(--mark-size)',
        height: 'var(--mark-size)',
        borderRadius: '50%',
        background: HEALTH_TOKEN[value],
      }}
    />
  );
}
