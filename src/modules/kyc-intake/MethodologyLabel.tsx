import type { RegulatoryAlignment } from '../../declarations/types.ts';

// TAD §D.6.7 — renders the module's declared alignment: the governing
// document alongside the regulatory expectation it answers to. Props:
// none in the TAD's own spec, but the value is declared data (never
// hardcoded), so it arrives as a prop from the declaration rather than
// importing the methodology reference directly — a second module carries
// its own without editing this file.
export function MethodologyLabel({ alignment }: { alignment: RegulatoryAlignment | undefined }): JSX.Element | null {
  if (!alignment) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* No explicit gap: both lines are --type-legend/--type-caption
          (16px each, i.e. the same size), so the separation between them
          is each line's own --leading-tight line-height, not a flex gap
          layered on top (Design System owner ruling, 26 Aug 2026 —
          "the space between lines of a text block is leading, not a
          flex gap"; try leading before reaching for --space-1). */}
      <span style={{ font: 'var(--weight-semibold) var(--type-legend) / var(--leading-tight) var(--font-family)', color: 'var(--ink-secondary)' }}>
        {alignment.document}
      </span>
      <span style={{ font: 'var(--weight-regular) var(--type-caption) / var(--leading-tight) var(--font-family)', color: 'var(--ink-tertiary)' }}>
        {alignment.citation}
      </span>
    </div>
  );
}
