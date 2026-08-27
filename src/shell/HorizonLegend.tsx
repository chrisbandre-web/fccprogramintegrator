import { boardContext } from '../declarations/contexts.ts';
import { moduleRegistry } from '../declarations/registry.ts';
import { useActiveContext, useContextHorizon } from './SessionStateProvider.tsx';

// TAD §D.5.9 — renders the active context's horizonLegend[horizon]
// string. Board and the live module both carry their own declared
// ByHorizon<string> (§D.4.1); this component composes no sentence of its
// own, in either case.
//
// TouchTwo Amendment 2, DD Appendix A.4 (25 Aug 2026) — adds the "Time
// Period — {qualifier}" header line above the value ("As at" on the
// Board, "Trailing" in a module), and supersedes the construction-time
// compressed value text ("Today"/"T-90") with the confirmed strings.
//
// Coordinator direction, 27 Aug 2026: both lines larger, with a little
// more separation between them so they read as a clear header-then-value
// pair rather than continuous wrapped text. Sizes PROVISIONAL, reused at
// --type-horizon-value's literal size for both lines (not the token
// itself) per the general "closer to Month/Quarter/Year" instruction.
//
// Revised twice more the same day. First: "Time Period — {qualifier}"
// wrapped wherever the frame's fixed width happened to break it
// ("Time Period — As" / "at"), so it was split into two deliberate
// lines. Second, seen against the actual render: three lines
// ("Time Period" / "— {qualifier}" / "{value}") read as one too many --
// "Time Period:" (colon, not an em dash) is now the header alone, and
// "{qualifier} {value}" ("As at Today") is one combined subheader line,
// sized down from 24 to fit as a single row rather than wrapping.
export function HorizonLegend(): JSX.Element {
  const [activeContext] = useActiveContext();
  const [horizon] = useContextHorizon();

  const declared =
    activeContext === 'board' ? boardContext : moduleRegistry.find((d) => d.id === activeContext);

  const horizonLegend = declared?.horizonLegend ?? boardContext.horizonLegend;
  const horizonQualifier = declared?.horizonQualifier ?? boardContext.horizonQualifier;

  return (
    <div>
      <div
        style={{
          font: 'var(--weight-regular) 24px / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-tertiary)',
          marginBottom: 'var(--space-1)',
        }}
      >
        Time Period:
      </div>
      <div
        style={{
          // PROVISIONAL, not yet a token -- 16 canvas (back to the
          // original pre-redesign floor), not 18. The Board's qualifier
          // + value combination ("As at Today," 11 characters) is the
          // short case; the module's is nearly double ("Trailing T - 365
          // Days," 22 characters) and was not the case shown when this
          // was last checked. 16 is the safer bet for both, but this
          // still needs an actual look at the module's Quarter/Year
          // view specifically -- the long case, not the one screenshot.
          font: 'var(--weight-regular) 16px / var(--leading-tight) var(--font-family)',
          color: 'var(--ink-tertiary)',
        }}
      >
        {horizonQualifier} {horizonLegend[horizon]}
      </div>
    </div>
  );
}
