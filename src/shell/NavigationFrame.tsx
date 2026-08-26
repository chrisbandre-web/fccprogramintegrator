import { ProgramElementSelector } from './ProgramElementSelector.tsx';
import { TimeHorizonControl } from './TimeHorizonControl.tsx';
import { HorizonLegend } from './HorizonLegend.tsx';
import { MarkLegend } from './MarkLegend.tsx';
import { AboutAffordance } from './AboutAffordance.tsx';

// TouchTwo Amendment 2 §4 — block order: brand mark · Program Element
// selector · Time Horizon control · horizon legend · mark legend · About.
// --frame-block-gap (32px) between blocks; --frame-padding (24px) is the
// frame's own inset.
export function NavigationFrame(): JSX.Element {
  return (
    <div
      style={{
        width: 'var(--frame-width)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--frame-block-gap)',
        padding: 'var(--frame-padding)',
        paddingRight: 'calc(var(--frame-padding) + var(--field-gutter))',
      }}
    >
      <BrandBlock />
      <ProgramElementSelector />
      <TimeHorizonControl />
      <HorizonLegend />
      <MarkLegend />
      <AboutAffordance />
    </div>
  );
}

// TouchTwo Amendment 2 §3 — FCC_mark_final.svg (5 arcs of stepped
// stroke-width forming an open ring, one segment in the brand accent),
// received from the Design System owner 25 Aug 2026 and reproduced here
// exactly (path data unchanged; stroke colors switched from the file's
// literal hex values to var(--brand-ink)/var(--brand-accent) so the
// component stays token-driven, per check.ts's TAD-4 — the delivered
// file's two colors are numerically identical to these two tokens).
// Never recoloured, rotated, or stretched beyond this (§3.2). The mark
// sits above the wordmark, stacked rather than side-by-side. Settled,
// 26 Aug 2026: FCC_lockup_final.svg's side-by-side proportions (780x160,
// ~42px text) are built for a wide banner placement, not the frame's
// 240-canvas clear width; verified below at --brand-mark-size (88px) plus
// wordmark, the stacked arrangement fits with margin at the frame's
// actual dimensions, so the reference lockup's own proportions were never
// going to apply here regardless of arrangement. Confirmed by the
// Coordinator rather than left as an open flag against the reference
// asset — no lockup SVG is used; mark and wordmark are composed directly.
function BrandBlock(): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <svg
        viewBox="0 0 200 200"
        style={{ width: 'var(--brand-mark-size)', height: 'var(--brand-mark-size)' }}
        role="img"
        aria-label="FCC Program Integrator"
      >
        <path d="M 88.54 35.00 A 66 66 0 0 1 145.85 52.52" fill="none" stroke="var(--brand-ink)" strokeWidth="6" strokeLinecap="butt" />
        <path d="M 152.01 59.37 A 66 66 0 0 1 163.44 118.19" fill="none" stroke="var(--brand-ink)" strokeWidth="9" strokeLinecap="butt" />
        <path d="M 160.29 126.84 A 66 66 0 0 1 113.72 164.56" fill="none" stroke="var(--brand-accent)" strokeWidth="12" strokeLinecap="butt" />
        <path d="M 104.60 165.84 A 66 66 0 0 1 49.44 142.42" fill="none" stroke="var(--brand-ink)" strokeWidth="15" strokeLinecap="butt" />
        <path d="M 44.03 134.97 A 66 66 0 0 1 42.84 67.00" fill="none" stroke="var(--brand-ink)" strokeWidth="19" strokeLinecap="butt" />
      </svg>
      <div
        style={{
          font: 'var(--weight-semibold) var(--type-tile-title) / var(--leading-tight) var(--font-family)',
          color: 'var(--brand-ink)',
        }}
      >
        FCC Program Integrator
      </div>
    </div>
  );
}
