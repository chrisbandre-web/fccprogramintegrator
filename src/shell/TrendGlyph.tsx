import type { TrendValue } from '../declarations/types.ts';

// TAD §D.5.19, Design System spec §5, corrected per the Architect's note
// (Mark and Glyph, 23 Aug 2026): the CSS border-triangle trick used
// previously rotated around its own (asymmetric) border-box center rather
// than the visual shape's center, producing the wrong apparent direction
// despite the rotation angles themselves being mathematically correct —
// verified empirically before this rewrite (a plain coordinate-rotation
// check confirmed -45deg genuinely gives up-right, +45deg down-right; the
// bug was in the CSS shape's implicit pivot, not the angles). SVG's
// rotate(angle, cx, cy) transform removes that ambiguity entirely by
// naming the pivot explicitly.
//
// Base glyph (0deg, Stable) points right: a solid triangle with a short
// stem, not a bare triangle — the stem is load-bearing at this size
// (14 canvas / 10.5 rendered), where a line-drawn arrow alone degrades to
// a smudge.
const ROTATION_DEG: Record<TrendValue, number> = {
  // Mirrors --trend-rotation-rising/-flat/-falling in fcc-tokens.css.
  // Kept as plain numbers rather than read from the CSS custom property
  // because SVG's native transform attribute is the more reliable,
  // unambiguous rotation mechanism here (see note above) — if the token
  // values ever change, update both.
  Increasing: -45,
  Stable: 0,
  Decreasing: 45,
};

const LABEL: Record<TrendValue, string> = {
  Increasing: 'Increasing',
  Stable: 'Stable',
  Decreasing: 'Decreasing',
};

export function TrendGlyph({ value }: { value: TrendValue }): JSX.Element {
  return (
    <svg
      viewBox="0 0 14 14"
      style={{ width: 'var(--trend-size)', height: 'var(--trend-size)' }}
      role="img"
      aria-label={LABEL[value]}
    >
      <g transform={`rotate(${ROTATION_DEG[value]} 7 7)`}>
        {/* Stem — short, per spec. Widened slightly (2 -> 2.5) to feel
            consistent with the bolder arrowhead below. */}
        <line x1="1" y1="7" x2="5" y2="7" stroke="var(--trend-ink)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arrowhead — enlarged 23 Aug 2026 (Design System owner's
            finding, from the deployed board: glyphs were reading as
            strokes, not solid triangles, at 10.5 rendered px). Base
            height was 8 of 14 canvas units; now 10, leaving only a 2-unit
            margin top and bottom — more mass without touching the
            viewBox or rotation pivot. */}
        <polygon points="5,2 5,12 13,7" fill="var(--trend-ink)" />
      </g>
    </svg>
  );
}
