// TAD §D.5.19, Design System spec §5, corrected per the Architect's note
// (Mark and Glyph, 23 Aug 2026): the mark must be a Harvey ball, not a
// uniform filled disc — shape carries severity redundantly with hue, since
// at 14 canvas there's no room for a label beside the mark, and hue alone
// would violate Rule E (colour as sole carrier of meaning). Shape and hue
// both derive from the same `value` prop through one exhaustive switch,
// so a mark can never exist with the right colour and the wrong form.
const CENTER = 7;
const RADIUS = 6; // fits inside the 14x14 viewBox with --mark-stroke (1.75) room to spare

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

export function HealthMark({ value }: { value: 'Red' | 'Amber' | 'Green' }): JSX.Element {
  const color = HEALTH_TOKEN[value];
  return (
    <svg
      viewBox="0 0 14 14"
      style={{ width: 'var(--mark-size)', height: 'var(--mark-size)' }}
      role="img"
      aria-label={HEALTH_LABEL[value]}
    >
      {value === 'Red' && <circle cx={CENTER} cy={CENTER} r={RADIUS} fill={color} />}
      {value === 'Amber' && (
        // Right-half fill — a consistent choice, same half on every Amber
        // mark, per the Architect's note (either half is acceptable
        // provided it's applied uniformly).
        <path
          d={`M ${CENTER} ${CENTER - RADIUS} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER} ${CENTER + RADIUS} L ${CENTER} ${CENTER} Z`}
          fill={color}
        />
      )}
      {/* The stroked outline — always present. Alone (Green) it reads as
          an open circle; underneath a fill (Red, Amber) it's simply the
          mark's edge. strokeWidth moved to `style` rather than a raw SVG
          attribute — 23 Aug 2026, per the Design System owner's finding
          that Green vs. the process-exemption's no-mark-at-all read too
          similarly at 10.5px rendered. A raw SVG presentation attribute's
          var() resolution is less consistently reliable across browsers
          than a genuine CSS style property; if the stroke had ever been
          silently falling back to SVG's default 1px instead of the full
          1.75px, that alone would explain a weaker, less deliberate-looking
          ring. */}
      <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={color} style={{ strokeWidth: 'var(--mark-stroke)' }} />
    </svg>
  );
}
