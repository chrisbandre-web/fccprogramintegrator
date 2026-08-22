# FCC Program Integrator
## Technical Architecture Document (TAD)
*Version: **1.1 · APPROVED** by the Coordinator, 21 August 2026 · Branch: **React Web Application** · Stack: React 18 + Vite + TypeScript (strict), hosted on Vercel, push-to-deploy from `chrisbandre-web/fccprogramintegrator` · Status: **Released for construction***
*Build: FCC Program Governance Dashboard (the seed build)*

> **Canonical position.** This document is the contract the Author builds every component against and the structural reference the Implementor assembles and deploys to. It is drafted from the complete Design Document v0.9.2 (20 August 2026) and the canonical external inputs listed there. Where this document needs domain logic, it **references the canonical input by section**; it does not restate it. This TAD is canonical-and-living and **lives in the repository as `TAD.md`** (Playbook: Flow and canonical state), so amendments and code travel together and "does the TAD match the code" is checkable in one place. Where this TAD and an upstream canonical document conflict, the conflict is escalated to the Coordinator and resolved by amending the upstream document — never by a silent deviation here (amend-upstream rule).

> **Approved by the Coordinator on 21 August 2026 and released for construction**, following two fresh-context Reviewer passes: an Author-readiness pass (21 August, five findings, all closed at v0.3) and a TAD-to-DD fidelity pass (21 August, clean, no findings). **The Author and Implementor read this document in full before acting, and reread it after any chat compression.**
>
> **All content and upstream items blocking phase 1 are closed.** The Coordinator's ruling on F.23 is recorded as a fifth supersession of the frozen Form in DD v0.9.3; the two Board mark-legend strings are confirmed in DD v0.9.4 as ***Business Risk*** and ***Control Risk***. The one remaining prerequisite is not architectural: **this file committed to the repository as `TAD.md`** (§A, §B.2).

> **Canonical inputs, by tier.**
> - ***Customer Risk Rating Methodology v2.3*** *(21 August 2026)* — the engine's verbatim source. Its twelve worked examples at §7 are the binding validation set. *(v2.3 aligned the jurisdiction band vocabulary at source; no scoring logic changed, so nothing in the engine or its gate moves.)*
> - ***Jurisdiction Risk Ratings*** *(20 August 2026)* — the Basel AML Index 2025 Public Edition derivation, ingested once (§C.4).
> - ***Design System spec v1.0*** and ***`fcc-tokens.css`*** *(Touch Two, 19 August 2026)* — the token file is the single source for every design value. **Where this document and the token file both state a number, the token file governs and this document is descriptive.**
> - ***Design Document v0.9.4*** *(21 August 2026)*, ***Design Direction brief v1.0***, ***Project Inception Form v1.2 (frozen)***, ***FCC Program Integrator Marketing Pack (DRAFT, 16 August 2026)*** — the last cited only as the source of the 13 default schema row labels.
> - ***Appendix B workbooks*** — `Tile_Content_Appendix_B_{MONTH,QUARTER,YEAR}_21AUG26.xlsx` (21 August 2026 revision, superseding the 20AUG26 issue), the transcription source for declaration data.

---

## A. How to Read This Document

1. **§B Environment & repo** and **§C Foundational infrastructure** establish the ground every component sits on. Lock these first. §C.1–§C.3 are the three elevated-lock seed contracts.
2. **§D Component universe** is the heart: every build unit to the **fixed per-component schema**. The Author can build any one component from its block alone without guessing. Non-obvious choices carry a *why other approaches were rejected* note.
3. **§E State & data flow** is the authoritative registry of where state lives and how data moves.
4. **§F Gap resolutions** closes all twenty-two ⚠️ flags from DD §8. If a downstream question seems open, check §F before escalating. Three resolutions carry **amend-upstream** notes and are listed at the end of §F.
5. **§G–§L** cover assembly and routing, domain configuration, web-platform constraints, the build/deploy sequence, the non-negotiable constraint recap, and appendices.

**What is authoritative where.** Domain *logic* belongs to the Methodology; domain *structure* is this document's. The *interaction vocabulary* is DD Appendix D's; this document specifies the components that implement it but does not re-decide it. The *visual treatment* is `fcc-tokens.css`'s; this document specifies the components that consume its tokens, never the values.

**Naming conventions.** Components `PascalCase` under `src/`; hooks `useCamelCase`; module and element identifiers `kebab-case` string literals; methodology attribute and band names carried **verbatim** from the Methodology in its own casing so the code and the canonical document stay textually traceable; declaration field vocabularies carried **verbatim from the Appendix B workbooks** (DD Appendix A.3), including `Register Row` with its capital R.

**Two words used precisely throughout.** An **element** is one of the 26 things on the board. A **module** is the declaration behind an element, plus — where live — the surfaces it mounts. Every element has a module; only one module is live. The board has no elements of its own.

---

## B. Environment & Repository

### B.1 Toolchain

- **Runtime:** Node **24.19.0**, pinned. Recorded exactly because Vercel builds on *its* Node version, not the Coordinator's, and a mismatch produces precisely the ambiguous failure DD §1 warns against. Pinned in three places that must agree: `.nvmrc`, `package.json` `engines.node`, and the Vercel project's Node.js Version setting.
- **Framework & build:** **React 18 + Vite**. Vite is already the scaffold in the repository; it is a single-page application with no server rendering, no routing library and no backend, which is the smallest thing that satisfies the build.
- **Language:** **TypeScript, strict mode**, converting the existing JavaScript scaffold in phase 1. Types are load-bearing here rather than stylistic: two of the three elevated-lock seed contracts (§C.1, §C.2) *are* types, and the claim that swapping the fixture for a backend requires no component change is enforced by a type system and merely asserted by a comment. `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- **Charts: none. Recharts is not installed.** See §F.23 — this is an **amend-upstream** item against the frozen Form.
- **Runtime dependencies: `react`, `react-dom`. That is the entire list.** No dependency is added beyond it without a Coordinator-approved amendment to this document.
- **Dev dependencies:** `vite`, `@vitejs/plugin-react`, `typescript`, `eslint` + config, `vitest`, `exceljs` (workbook reading, build-time only — never bundled). Dev tooling is exempt from the runtime package policy but is enumerated here so the exemption is bounded rather than open.
- **Lint/format:** the repository's `eslint.config.js`, extended with the three custom rules in §L.3.

> 📐 **Design Note.** No router, no state library, no CSS framework, no icon set, no chart library, no date library. The application has four surfaces, one overlay, no URL state and no server. Every one of these would be a permanent cost carried for an occasional benefit, which is the razor applied to `node_modules`. Rejected explicitly so nobody reintroduces one believing it was merely missing.

### B.2 Repository layout

```
fccprogramintegrator/
  README.md                     run-locally + deploy + the check script
  TAD.md                        this document (canonical-and-living, in-repo)
  .nvmrc                        24.19.0
  index.html                    font preload before any stylesheet (§H.3)
  vite.config.ts
  tsconfig.json
  eslint.config.js
  public/
    fonts/Inter.var.woff2
    robots.txt                  noindex (§I.5)
  content/
    Tile_Content_Appendix_B_MONTH_21AUG26.xlsx      committed, canonical, never edited in-repo
    Tile_Content_Appendix_B_QUARTER_21AUG26.xlsx
    Tile_Content_Appendix_B_YEAR_21AUG26.xlsx
  scripts/
    generate-declarations.ts    workbooks  -> src/generated/declarations.generated.json
    generate-fixture.ts         seeded generator -> src/generated/fixture.generated.json
    check.ts                    the one check script (§L.3)
  config/
    fixture.config.ts           every tuning knob, one file (DD §3)
  src/
    main.tsx                    composition root: load, score, freeze, render
    App.tsx
    declarations/               THE DECLARATION CONTRACT (seed contracts §C.1, §C.2)
      types.ts
      schema.ts                 the 13 default rows, as data
      contexts.ts               the Board context declaration
      registry.ts               the module declaration registry
      load.ts
    data/                       THE DATA-ACCESS CONTRACT (seed contract §C.3)
      types.ts
      dataAccess.ts             the interface
      fixtureDataAccess.ts      its first implementation
      snapshot.ts
    engine/                     canonical-input-faithful, headless, no UI imports
      methodology.ts
      score.ts
      workedExamples.ts
      reference/
        jurisdictions.ts        ingested Basel table + provenance
        industries.ts           ingested NAICS table + provenance
    shell/                      the chassis: frame, board, element rendering
    modules/
      kyc-intake/               the one live module
    design/
      tokens.css                fcc-tokens.css, verbatim, never edited
      canvas.css
      elements.css
    lib/
    generated/                  GENERATED — DO NOT EDIT
      declarations.generated.json
      fixture.generated.json
```

**Four invariants in that tree**, each mechanically checked (§L.3): the TAD is in-repo · the data layer is isolated behind `src/data` · the engine imports nothing from the UI · generated files are never hand-edited.

### B.3 Hosting & deployment

- **Host:** Vercel, Hobby, project `fccprogramintegrator`, connected to `chrisbandre-web/fccprogramintegrator`, push-to-deploy from `main`.
- **Production URL:** `https://fccprogramintegrator.vercel.app/`. Public by decision; see §I.5.
- **The static shell ships to the host in phase 1** (§J) so pipeline friction surfaces while it is cheap. Redeploy at every phase exit.
- **Node parity is a phase 1 exit line:** the Vercel project's Node version must read 24.x and the deploy log must confirm it.
- **CI:** one GitHub Action running `npm run check` on push to `main`. **Advisory, never gating** — it reports; it does not block a deploy. A check that can stop a deploy during a demo window is a liability, and the phase gates are where a failure is meant to be acted on.

> 📐 **Design Note — why no pre-commit hook.** A hook that silently refuses a commit is exactly the *"it looks slightly wrong and nobody can tell why"* failure mode DD §1 requires the architecture to design against, and it costs a dependency plus a local install step on a machine new to this pipeline. Rejected in favour of one npm script a human can run and read.

### B.4 Settings of record

- **Design canvas:** 1920 × 1080, scaled uniformly to fit (§C.5). This is a hard structural constraint, not a stylesheet preference.
- **Browser support floor:** current Chrome, Safari, Edge and Firefox. The build uses CSS custom properties, CSS grid, `@font-face` `size-adjust` and `prefers-reduced-motion` — all baseline in current browsers. No polyfills, no build-time browser targeting beyond Vite's default.
- **React StrictMode: on** in development. The engine is pure and the fixture is frozen, so double-invocation is harmless and surfaces accidental impurity early.
- **No environment variables.** There is nothing to configure at deploy time; anything that would be an env var is either a token or a tuning knob, both of which are files.

---

## C. Foundational Infrastructure

*Five items. §C.1, §C.2 and §C.3 are the elevated-lock seed contracts (§K.1).*

### C.1 The module declaration registry *(seed contract — closes ⚠️ A1)*

**What it is.** A single ordered array of `ModuleDeclaration` values. The shell renders whatever is in it, in the order it is in, into the band each declaration names. **The shell holds no element inventory, no element identifiers, and no per-element branch.** Turning a module off is deleting an entry.

```ts
// src/declarations/registry.ts
export const moduleRegistry: readonly ModuleDeclaration[] = [
  ...inactiveDeclarations,          // 25, from src/generated/declarations.generated.json
  customerIntakeModule,             // 1, the live module, from src/modules/kyc-intake
];
```

`inactiveDeclarations` is generated data. `customerIntakeModule` is a code module that **merges its generated board content with its capabilities** — surfaces, bindings, legend — so that the live element and the twenty-five inactive ones are the same kind of value in the same array. That sameness is the seed contract: a successor platform turning on a second module adds a second code module to this array and changes nothing else.

**Bands are shell data, not module data.** A tiny band registry declares the two regions, their labels, their order, and **which presentation they draw in**:

```ts
// src/shell/bands.ts
export const bands = [
  { id: 'business-risk',    label: 'Business Risk',    presentation: 'tile'        },
  { id: 'program-elements', label: 'Program Elements', presentation: 'registerRow' },
] as const;
```

> 📐 **Design Note — why presentation belongs to the band and not to the module.** DD §5 requires that a module declare what it *has* while the band determines how it is *drawn*, so that the two components never become two contracts. The workbooks carry a `Presentation` column, but its value is a function of `Band` on all 26 rows; carrying it into the declaration would create a second source that can disagree with the first. It is therefore used at transcription as a **cross-check assertion** — the same treatment §C.4 gives the Basel table's Risk Rating column — and does not survive into the runtime declaration. Rejected: letting a module declare its own presentation (a module could then declare a presentation its band cannot draw); inferring presentation from element count (magic).

**Groups are module data.** Each declaration names its group, and the shell starts a fresh row when the declared group changes in render order (§F.8). Group order is the order of first appearance. The shell never names a group.

### C.2 The module declaration schema *(seed contract — closes ⚠️ A2)*

**The schema is data.** A module's requirement schema is an ordered list of named rows, each of which may carry content or not:

```ts
// src/declarations/types.ts
export interface RequirementRow {
  readonly id: string;          // stable key
  readonly label: string;       // the row's name, renameable by a deployment
  readonly content: string | null;   // null = declared and unpopulated
}
export type DeclarationSchema = readonly RequirementRow[];
```

The thirteen default rows are a **value**, not a type:

```ts
// src/declarations/schema.ts — labels carried verbatim from the Marketing Pack (16 Aug 2026)
export const DEFAULT_SCHEMA_ROW_LABELS = [
  'Risk Appetite', 'Governance', 'Control Process', 'Process Inputs / Outputs',
  'Roles & Responsibilities', 'Metrics', 'Reporting Channels / Frequency',
  'Independent Testing', 'Effectiveness Documentation', 'Data Sourcing',
  'Data Governance', 'Model & Non-Model Tools',
  'Model & Non-Model Tools Testing and Governance',
] as const;

export const defaultSchema = (): DeclarationSchema =>
  DEFAULT_SCHEMA_ROW_LABELS.map((label, i) => ({ id: `row-${i + 1}`, label, content: null }));
```

**In this build the schema is carried, unpopulated and unrendered.** There are no operating control modules, so nothing exercises it. The only property construction can demonstrate is that it is not a fixed type — which is a weaker claim than "proven," stated deliberately (DD §5).

**How that claim is made mechanical.** `src/declarations/schema.contract.test.ts` constructs a schema with **three** rows and one with **fifteen renamed** rows, assigns both to `DeclarationSchema`, and passes both through the same code path the build uses. It contains no runtime assertions worth speaking of; **its job is to fail compilation** if anyone declares a thirteen-field interface. That is the check, and it is the check because the failure this flag exists to prevent is a *type* failure.

> 📐 **Design Note.** Rejected: `interface Schema { riskAppetite: string; governance: string; ... }` — the exact failure the Form and the DD both warn about, and the one an Architect arrives at naturally from "the schema is 13 rows." Also rejected: a `Record<RowLabel, string>` keyed by a string-literal union, which is the same failure wearing a different hat — renaming a row would then be a type change.

### C.3 The data-access interface *(seed contract — closes ⚠️ A3, ⚠️ A6, ⚠️ A7, ⚠️ A21)*

**No component reads the fixture.** Every record any surface displays arrives through one interface:

```ts
// src/data/dataAccess.ts
export type Population   = 'book' | 'intake';
export type BusinessLine = 'retail-consumer' | 'commercial' | 'asset-management';
export type Rating       = 'Low' | 'Medium' | 'High';

export interface CustomerQuery {
  readonly population: Population;
  /** The date the window is measured back from. Defaults to the snapshot's asOf. */
  readonly asOf?: IsoDate;
  /** Trailing window length in days. Intake only; ignored for the book. */
  readonly windowDays?: number;
  readonly businessLine?: BusinessLine;
  readonly rating?: Rating;
}

export interface CustomerDataAccess {
  query(q: CustomerQuery): readonly CustomerRecord[];
  count(q: CustomerQuery): number;
  /** Provenance for the About panel and the record view. Never a display string. */
  meta(): SnapshotMeta;
}
```

**One primitive serves both number sets (⚠️ A7).** The Board's *as-at* reading is `{ population: 'intake', asOf: today − {0, 90, 365} days, windowDays: 30 }`. The module's *trailing window* is `{ population: 'intake', asOf: today, windowDays: {30, 90, 365} }`. There is no second code path, no second store and no per-horizon precomputation.

> 📐 **Design Note — this is why Month agrees across both contexts.** DD §3 records that the Board and the module coincide at 11.0% on Month and diverge at Quarter and Year. Under one primitive that agreement is **structural**: Board-Month and module-Month resolve to the identical query, so they cannot drift apart even if a knob moves. Under two code paths it would have been a coincidence maintained by hand — which is how a prior version came to ship the wrong number set. The seam most likely to produce that error is closed by construction rather than by care.

**Three properties the interface must keep.**

1. **Synchronous.** DD §3 forbids a loading state and requires scoring before first paint. `query()` returns an array, not a promise.
2. **Asynchronous-ready anyway.** The async seam sits at the **composition root**, not in the interface: a backend implementation fetches its snapshot before `createRoot().render()` and hands the same synchronous interface to the same components. *Rejected: making `query()` return `Promise<...>` — it would force a loading state into every consumer, which the design forbids for reasons measured at first paint, and it would make the interface's shape a function of its first implementation.*
3. **Presentation-blind (⚠️ A21).** No `page`, no `pageSize`, no sort order, no formatted strings. Pagination is a module concern (§D.6.8). *Rejected: `query(q, {page, pageSize})` — the interface would then have to change when the design changes page size from 25 to 20, which is the definition of a leaked concern.*

**Aggregates are not on the interface.** The Comparison's compositions and the live tile's High share are **derived on render** by module-owned selectors from `query()` results (§D.6.9). Nothing derived is ever stored.

### C.4 Ingested reference tables *(closes ⚠️ A5)*

Two tables are build configuration derived once from canonical sources, and both live **inside the engine** because both must resolve at scoring time and nothing outside the engine may consume them.

| Table | File | Source | Locked at |
|---|---|---|---|
| Jurisdictions | `src/engine/reference/jurisdictions.ts` | *Jurisdiction Risk Ratings, 20 August 2026*, deriving the Basel AML Index Public Edition 2025 ranking | Edition 2025 · accessed 20 Aug 2026 · threshold `> 5.00` |
| Industries | `src/engine/reference/industries.ts` | Methodology §3.1, the three-tier NAICS list | CRRM v2.3 · 21 Aug 2026 |

Each file carries a frozen provenance constant — `SOURCE`, `EDITION`, `ACCESSED`, `THRESHOLD` — beside its data, and each exports a resolver, never a raw table:

```ts
export type JurisdictionBand = 'High' | 'Medium' | 'Low';   // CRRM v2.3 §4
export function jurisdictionBand(country: string): JurisdictionBand
export function industryBand(naics: string): 1 | 3 | 5
```

**The band vocabulary is one word, everywhere.** CRRM v2.3 §4 names the three bands `High` / `Medium` / `Low` at 5 / 3 / 1 points, matching §3's attribute table, matching every other attribute in the model, and matching the Risk Rating column of the *Jurisdiction Risk Ratings* document verbatim. *Foreign, non-high-risk* and *Domestic* are §4's **criteria** — descriptions of what earns the Medium and Low bands — and are not band identifiers. They appear in the Methodology's worked examples and in the DD as descriptions of profiles, and **must not be used as values anywhere in the build.** *(This is the resolution of the vocabulary mismatch raised by the TAD Reviewer on 21 August 2026 and corrected at source in CRRM v2.3; before that correction the assertion below would have compared `'High-risk'` against `'High'` and failed on all 177 rows.)*

**Ingestion rules, all three enforced.**

- **The jurisdiction band is derived, never read.** The file carries `country`, `overallScore` and `assertedBand`. `jurisdictionBand()` computes the band from the score and the country's identity:

  ```ts
  country === 'United States' ? 'Low'
    : overallScore > 5.00     ? 'High'
    :                           'Medium'
  ```

  `assertedBand` is the source document's own **Risk Rating** value, stored **verbatim and untranslated** — the vocabularies are identical since CRRM v2.3, so no mapping step exists or is needed. A startup assertion compares `jurisdictionBand(country)` against `assertedBand` across all **177** rows. **A disagreement is a hard failure, not a warning.** Worked: **Bulgaria, overall score 5.00 → not strictly greater than 5.00 → derived `Medium`; source Risk Rating `Medium`; assertion passes.** Under the pre-correction wording of the Methodology this row read `High`, and it is the row that surfaced the 5.00 boundary defect before ingestion.
- **The `Low` band's identity rule is asserted, not assumed.** `Low` is defined as the United States alone. A second startup assertion requires that **exactly one row carries `assertedBand === 'Low'` and that row is the United States.** Without it, a future Basel edition banding another country Low would be silently mislabelled as domestic — on the attribute carrying 30% of the score, which is the last place to inherit an unchecked assumption.
- **Unlisted jurisdictions score High** (Coordinator rule, 20 August 2026). The engine honours it unconditionally. **The generator does not rely on it:** the fixture draws countries from a closed vocabulary — the 177 table entries plus any deliberately-unlisted jurisdictions named in `config/fixture.config.ts` — so a misspelled country name cannot masquerade as a risk band. Validation check **DD-15** (§H.4) fails on any record whose country is outside that vocabulary.
- **Comprehensively-sanctioned jurisdictions never appear in the fixture.** The block sits upstream of rating in the depicted institution, so the constraint lives in the generator, not the table — the table legitimately still lists Cuba.

> 📐 **Design Note — why in the engine rather than in `config/`.** DD §8 makes band resolution part of honest computation: a record carries a country and the engine resolves the band, so a hand-set band is impossible. Placing the tables in `config/` alongside the tuning knobs would invite the generator to resolve bands itself and write them into records — which is precisely check **DD-15**'s failure. Placing them in a "reference module" consumable by the UI would invite the record table to display a band the engine did not compute. Engine-internal, resolver-only, import-restricted.

### C.5 The canvas *(closes ⚠️ A11)*

The application is a **fixed 1920 × 1080 root** scaled uniformly to fit the viewport. This is infrastructure rather than styling because DD §1 makes no-scroll a success-criterion dependency, and a board that quietly grows past its height fails the leading criterion invisibly.

```css
/* src/design/canvas.css */
.canvas-viewport { position: fixed; inset: 0; display: grid; place-items: center;
                   overflow: hidden; background: var(--ground); }
.canvas-root     { width: var(--canvas-width); height: var(--canvas-height);
                   overflow: hidden;                       /* the structural guarantee */
                   transform: scale(var(--canvas-scale)); transform-origin: center; }
```

`--canvas-scale` is set once by `CanvasRoot` (§D.4.1) from `min(vw / 1920, vh / 1080)` and updated on resize. `overflow: hidden` on a fixed-height root is what makes overflow **impossible rather than unlikely** — nothing can scroll and nothing can push the board taller.

That guarantees the board never scrolls. It does **not** guarantee content fits its box; content that overruns is clipped, which is worse than obvious. Two further layers close that:

1. **`OverflowSentinel`** (§D.4.12), development-only, walks every element box after layout and reports by element id anything whose `scrollWidth` or `scrollHeight` exceeds its client box. It renders a loud banner in dev and is tree-shaken out of production. This is an exact measurement in the real font at the real size, which no build-time estimate can match.
2. **Character budgets in the transcription script** (§D.2.1), as an early warning before a board exists to look at.

> 🔧 **Implementation Note — the finding this closed.** Against the 20 August workbooks, nineteen of twenty-four register rows overran the measured line-2 budget, the worst by roughly 85%. The Coordinator's 21 August content revision cleared all of them: the longest line 2 is now 55 characters against a budget of 62. **The three layers stay in place as a regression guard**, because the next content edit is the one nobody will re-measure by hand.


---

## D. Component Universe

> **Fixed per-component schema:** **Identity/path** · **Dependencies** · **Placement** · **Responsibility** · **Props/configuration** · **State owned** · **Lifecycle** · **Inputs/outputs**.

### Quick Index

| # | Unit | Area | Responsibility (one line) |
|---|---|---|---|
| D.1.1 | `generate-declarations.ts` | build-time | Turn the three workbooks into declaration data |
| D.1.2 | `generate-fixture.ts` | build-time | Produce the seeded, honestly-scored population |
| D.1.3 | `check.ts` | build-time | Run every mechanical claim this document makes |
| D.2.1 | `methodology.ts` | engine | The canonical rule, as constants and band functions |
| D.2.2 | `score.ts` | engine | Score one customer; apply the PEP floor |
| D.2.3 | `reference/jurisdictions.ts` | engine | Resolve a country to a jurisdiction band |
| D.2.4 | `reference/industries.ts` | engine | Resolve a NAICS code to an industry band |
| D.2.5 | `workedExamples.ts` | engine | The twelve canonical examples, as data |
| D.3.1 | `data/types.ts` | data | The record and query types |
| D.3.2 | `dataAccess.ts` | data | The interface every component reads through |
| D.3.3 | `fixtureDataAccess.ts` | data | Its first implementation, over a frozen snapshot |
| D.3.4 | `snapshot.ts` | data | Load, score, freeze — once, before first paint |
| D.4.1 | `declarations/types.ts` | declarations | The declaration and slot types |
| D.4.2 | `schema.ts` | declarations | The 13 default rows, as data |
| D.4.3 | `registry.ts` | declarations | The ordered array the board renders |
| D.4.4 | `contexts.ts` | declarations | The Board context's own declaration |
| D.4.5 | `load.ts` | declarations | Parse and validate generated declaration data |
| D.5.1 | `main.tsx` | shell | Composition root |
| D.5.2 | `App.tsx` | shell | Providers and the error boundary |
| D.5.3 | `CanvasRoot` | shell | The fixed 1920×1080 root and its scale |
| D.5.4 | `SessionStateProvider` | shell | Active context, per-context horizon, opaque module state |
| D.5.5 | `Shell` | shell | Frame beside content area |
| D.5.6 | `NavigationFrame` | shell | The four frame elements in order |
| D.5.7 | `ProgramElementSelector` | shell | 27 entries; enters a context |
| D.5.8 | `TimeHorizonControl` | shell | One control, context-scoped value |
| D.5.9 | `HorizonLegend` | shell | What the active context's horizons mean |
| D.5.10 | `MarkLegend` | shell | The active context's declared legend |
| D.5.11 | `AboutAffordance` | shell | The About trigger |
| D.5.12 | `AboutModal` | shell | The one overlay and the one focus trap |
| D.5.13 | `Board` | shell | Render bands from the registry |
| D.5.14 | `BandLabel` | shell | A band's label block |
| D.5.15 | `TileBand` | shell | The two-tile band |
| D.5.16 | `RegisterField` | shell | Three columns, ten rows, six groups |
| D.5.17 | `ElementTile` | shell | One element, tile presentation |
| D.5.18 | `RegisterRow` | shell | One element, register presentation |
| D.5.19 | `HealthMark` | shell | The Harvey ball |
| D.5.20 | `TrendGlyph` | shell | The rotated solid triangle |
| D.5.21 | `HeroValue` | shell | A hero number and its unit |
| D.5.22 | `ScrimLayer` | shell | The one place the scrim exists |
| D.5.23 | `FixtureErrorState` | shell | The build's one error state |
| D.5.24 | `OverflowSentinel` | shell (dev) | Report any box whose content overruns it |
| D.6.1 | `kyc-intake/declaration.ts` | module | Merge generated content with capabilities |
| D.6.2 | `CustomerIntakeModule` | module | The module's surface root |
| D.6.3 | `moduleState.ts` | module | One reducer, one state object |
| D.6.4 | `selectors.ts` | module | Every derivation the surfaces display |
| D.6.5 | `Comparison` | module | Eight bars, or four |
| D.6.6 | `CompositionBar` | module | One 100% stacked composition |
| D.6.7 | `MethodologyLabel` | module | The traceability moment |
| D.6.8 | `RecordsPanel` | module | The records surface and its states |
| D.6.9 | `RecordTable` | module | Eleven columns |
| D.6.10 | `RatingFilter` | module | All / Low / Medium / High |
| D.6.11 | `Pagination` | module | 25 per page, present only when needed |
| D.7.1 | `lib/format.ts` | shared | Every number-to-string in the build |
| D.7.2 | `design/*.css` | shared | Tokens, canvas, element treatment |

*(45 units; the count summary by area is §L.2.)*

---

### D.1 — Build-time units

These run on the Coordinator's machine, never on Vercel and never in the browser. Their outputs are committed.

#### D.1.1 `scripts/generate-declarations.ts` *(closes ⚠️ A13)*
- **Identity / path:** `scripts/generate-declarations.ts`. Node script, run by `npm run generate:declarations`.
- **Dependencies:** `exceljs`; `src/declarations/types.ts`; `src/declarations/schema.ts`. Imports nothing from `src/shell` or `src/modules`.
- **Placement:** build-time only.
- **Responsibility:** read the three Appendix B workbooks and emit `src/generated/declarations.generated.json` plus a manifest recording each workbook's filename and SHA-256.
- **Props / configuration:** none. The three workbook paths are constants.
- **State owned:** none. Pure function of the three files.
- **Lifecycle:** run on demand. Never runs during `vite build`.
- **Inputs / outputs:** in — three `.xlsx` files from `content/`. Out — one JSON file, one manifest, and a non-zero exit on any violation below.

**The transcription contract, stated exactly.** Row 10 is the header; rows 11–36 are the 26 elements; the three files must agree on `#`, `Element`, `Band`, `Group`, `Presentation` and `Status` for every element and disagree only on the authored content columns.

| Workbook column | Becomes | Mapping |
|---|---|---|
| `Element` | `content[h].title` | verbatim |
| `Band` | `placement.band` | `Business Risk → business-risk` · `Program Elements → program-elements` |
| `Group` | `placement.group` | `-` → `null`; otherwise verbatim |
| `Presentation` | *(nothing)* | **cross-check only** — asserted equal to the band's presentation (§C.1) |
| `Status` | `status` | `LIVE → live` · `Inactive → inactive` |
| `Metric header` | `content[h].metricHeader` | `None` → `null`; otherwise verbatim |
| `Hero value` + `Unit / format` | `content[h].hero` | `computed` → `{kind:'computed'}` placeholder, replaced in code (§D.6.1) · `n/a` → `{kind:'absent'}` · otherwise `{kind:'authored', value, unit}`, `unit ∈ {'%','count','Days'}` (§L.4.6) |
| `Trend` | `content[h].trend` | `computed` → `{kind:'computed'}` placeholder · `None` → `{kind:'absent'}` · otherwise `{kind:'authored', value}` |
| `Health` | `content[h].health` | `None` → `{kind:'absent'}` · otherwise `{kind:'authored', value}` |
| `Feed caption` | `content[h].feedCaption` | verbatim |
| `Notes` | *(nothing)* | Author-facing prose, deliberately not imported |

**Nine gate conditions. Any one fails the run.**

1. All three workbooks present, readable, and 26 element rows each.
2. Structural columns identical across the three files, per element.
3. `Presentation` agrees with the band's declared presentation on all 26 rows.
4. Every enum value is in its Appendix A.3 set, **matched exactly including case** — `Register Row`, `Increasing`, `Red`, `None`. `Unit / format` is one of `%`, `count`, `Days`, `n/a`.
5. No blank cell in any content column. A blank is not `None` (DD Appendix B).
6. Exactly one row has `Status = LIVE`.
7. `Group` is `-` for exactly the two `Business Risk` rows.
8. Element ids are unique and stable, derived by slugifying `Element` once — the id is written into the JSON so a later title edit cannot silently repoint a declaration.
9. **Character budgets** (§C.5), **which differ by presentation because the two presentations arrange text differently**:
   - **All 26 elements:** `title ≤ 28`.
   - **`Register Row` elements only:** `metricHeader + ' · ' + feedCaption ≤ 62`. The concatenation is the measurement because a register row puts both on one line; the 62 is derived from that line's 485-canvas width.
   - **`Tile` elements only:** `metricHeader ≤ 60` **and** `feedCaption ≤ 60`, measured **separately**. A tile is a vertical stack — hero with its metric header, caption on its own line — so **a tile has no concatenated line 2 and the 62-character figure has no meaning for it.** The tile budgets derive from the tile's own ~776-canvas width and are **provisional**, confirmed by `OverflowSentinel` at the phase 1 exit in the same way as `--register-title-width`.

   Over-budget rows are listed by element, presentation and measured length. **These are provisional early-warning figures derived from the Design System spec §2 geometry, not exact text measurement**; the authoritative check is `OverflowSentinel` against the deployed board at phase 1. See §F.11.

> 🔧 **Implementation Note — measured against the 21 August workbooks, by presentation.** Longest title 27 (*FCC Risk Appetite Statement*) against 28, across all 26. Among the **24 register rows**, longest concatenated line 2 is **55** (*Exam / Audit Mgmt.*) against 62, with *EWRA*, *Change Mgmt.* and *Information Sharing* tied next at 49. Among the **2 tiles**, longest metric header is 28 and longest caption 28 (*Transactions*), against 60 each; its concatenated length would be 59, but that string never appears on screen and is not measured. **All 26 elements clear their own budgets on all three horizons.** The budgets are a regression guard, not an open finding. *(The by-presentation split, and the correction of an earlier claim that ranked tiles against the register budget, are the resolution of TAD Reviewer Finding 2, 21 August 2026.)*

> 🔧 **Implementation Note — whitespace, and one Author-facing item.** The transcription script **collapses runs of internal whitespace to one and trims**, and reports any cell it changed. This is a general hygiene rule for spreadsheet-sourced strings — a stray double space imports verbatim and renders verbatim — and it costs one line; **it is not a response to any defect in the committed workbooks, which are clean.** *(v0.2 reported a double space in `QA`'s metric header. That was a misreading of terminal output on the Architect's part, not a workbook defect; all three 21 August files read `# QA tests overdue` with a single space. Corrected per TAD Reviewer Finding 5, 21 August 2026, and recorded rather than deleted.)* Separately, the EWRA row's `Notes` cell still describes it as a label-only process tile while the row correctly carries `42 / Increasing / Amber`; `Notes` is not imported, so this is Author-facing prose only.

**Divergence detection.** The manifest's hashes make a later edit mechanically visible: regenerate, and either the output is byte-identical or a workbook moved without a regeneration. `check.ts` runs exactly that (§D.1.3), and the phase 1 content gate runs `check.ts`.

> 📐 **Design Note — why generate-and-commit rather than parse at build time.** Parsing `.xlsx` during every Vercel build puts a binary file format, a parser and a build step into the deploy chain of a pipeline nobody on the team has run before, in exchange for a convenience worth having a handful of times. The founding razor decides it: a permanent cost for an occasional benefit. **The workbooks remain canonical; the generated file is never hand-edited; a content change is a workbook edit followed by a regeneration, in that order.** *(Designer response to Architect Q1, 20 August 2026.)*

> 🔧 **Implementation Note — the stale EWRA note.** The EWRA row's `Notes` cell still reads *"Process tile. Label only by design — no hero, no trend, no health mark"* while the row correctly carries `42 / Increasing / Amber`, per DD §3's record that EWRA moved. The `Notes` column is not imported, so this is harmless to the build — recorded here only so an Author reading the workbook does not file a bug. A Coordinator content correction at the next workbook touch.

#### D.1.2 `scripts/generate-fixture.ts`
- **Identity / path:** `scripts/generate-fixture.ts`. Run by `npm run generate:fixture`.
- **Dependencies:** `config/fixture.config.ts`; the engine (`src/engine/*`). **Imports nothing from `src/data`, `src/shell` or `src/modules`.**
- **Placement:** build-time only.
- **Responsibility:** produce the four populations as **source attributes only**, score them with the real engine, and emit `src/generated/fixture.generated.json` — plus a validation report against the twenty-two **DD-checks** of DD §3.
- **Props / configuration:** every tuning knob from `config/fixture.config.ts` (§H.4). No knob is defined here.
- **State owned:** a seeded PRNG, from `randomSeed`.
- **Lifecycle:** run on demand; re-run whenever a knob moves. Deterministic — the same config produces a byte-identical file.
- **Inputs / outputs:** in — config. Out — the fixture JSON, the validation report, and a non-zero exit if any binary check fails.

**Two rules govern it absolutely.** The generator writes **only source attributes** — entity type, NAICS code, product, country, TM alert count, PEP status, business line, `onboardedAt`. Every derived field is written by the engine in the same pass. And when output misses a target, **the knobs move, never the rule** (DD §3); if the knobs cannot reach it, that is a flag to the Coordinator.

> 🔧 **Implementation Note.** The generator emits source attributes *and* the engine's derived output into the same file, so the shipped fixture is self-describing and the record view needs no scoring at runtime. **The snapshot re-scores anyway** (§D.3.4) and asserts equality, because a fixture whose stored derivations disagree with the engine is the one failure mode that would put a wrong number on screen with everything else looking healthy.

#### D.1.3 `scripts/check.ts`
- **Identity / path:** `scripts/check.ts`. Run by `npm run check`; also the GitHub Action's only step.
- **Dependencies:** the engine; the declaration loader; `vitest` for the test-shaped checks; the repository source as text for the grep-shaped ones.
- **Placement:** build-time and CI.
- **Responsibility:** run every mechanically checkable claim this document makes, in one place, and print a pass/fail line per claim.
- **Props / configuration:** none.
- **State owned:** none.
- **Lifecycle:** on demand.
- **Inputs / outputs:** the full check list is §L.3; output is a human-readable report and an exit code.

---

### D.2 — The engine
*Canonical-input-faithful, headless, and importing nothing from any other layer.*

#### D.2.1 `src/engine/methodology.ts`
- **Identity / path:** plain TypeScript module.
- **Dependencies:** none. This file is the bottom of the import graph.
- **Placement:** engine.
- **Responsibility:** carry the Methodology's constants and band functions verbatim — attribute weights, point bands, rating thresholds, and the PEP floor table.
- **Props / configuration:** none. **No value here is configurable.** The weights and thresholds are canonical and a knob over them would be a rule change wearing a configuration hat.
- **State owned:** none. All exports are `as const`.
- **Lifecycle:** stateless.
- **Inputs / outputs:** exports `WEIGHTS` (Entity 0.10 · Industry 0.20 · Product 0.25 · Jurisdiction 0.30 · TM Alerts 0.15), `ratingFromScore(score)` implementing the strict inequalities at 4.20 / 3.40 / 2.40, `pepFloor(status)`, and the point-band lookups for entity type, product and TM alerts.

> 🔧 **Implementation Note.** Attribute and band names are carried **verbatim from CRRM v2.3 in its own casing** so a practitioner reading the code and the document sees the same strings. The thresholds are written as strict inequalities in the same direction the document states them; a `>=` here is a domain error, not a style choice, and worked examples 3, 5 and 8 exist to catch it.

#### D.2.2 `src/engine/score.ts`
- **Identity / path:** plain TypeScript module.
- **Dependencies:** `methodology.ts`, `reference/jurisdictions.ts`, `reference/industries.ts`.
- **Placement:** engine.
- **Responsibility:** take one customer's **source attributes** and return its points, score, rating, route and fired factors.
- **Props / configuration:** none.
- **State owned:** none. Pure.
- **Lifecycle:** stateless; called ~4,850 times at startup.
- **Inputs / outputs:** in — `CustomerSource`. Out — `{ points, score, scoredRating, rating, route, firedFactors }`.

**Three properties the type system enforces.** The function takes source attributes only, so a caller *cannot* pass a pre-set band or rating. The jurisdiction and industry bands are resolved inside, from country and NAICS code. And `rating` is the higher of `scoredRating` and `pepFloor(pep)`, with `route: 'on score' | 'PEP escalation'` recording which produced it — the override is a floor, never a ceiling (CRRM §6).

> 📐 **Design Note.** Rejected: a `score(customer)` that accepts a full `CustomerRecord`. It would make it possible to pass a record that already carries a rating and get a different one back, which is the shape of every hand-set-derived-field bug. Taking source only makes the honest path the only path.

#### D.2.3 `src/engine/reference/jurisdictions.ts`
- **Identity / path:** generated-once data plus a resolver. Marked *ingested — do not edit by hand*.
- **Dependencies:** none.
- **Placement:** engine-internal. Import-restricted: nothing outside `src/engine/` may import it (§L.3).
- **Responsibility:** resolve a country name to its jurisdiction band, and carry the ingestion's provenance.
- **Props / configuration:** none.
- **State owned:** the frozen 177-row table and its `SOURCE / EDITION / ACCESSED / THRESHOLD` constants.
- **Lifecycle:** two startup assertions (§D.3.4), both hard failures: the derived band matches `assertedBand` on all 177 rows, and exactly one row is `Low` and it is the United States.
- **Inputs / outputs:** in — a country string. Out — `'High' | 'Medium' | 'Low'` (CRRM v2.3 §4). An unlisted country returns `'High'` per the Coordinator's 20 August rule.

#### D.2.4 `src/engine/reference/industries.ts`
- As D.2.3, over the Methodology §3.1 NAICS list. Exports `industryBand(naics)` returning 5 / 3 / 1, and `industryDescription(naics)` — the plain-English description the record table displays before the code in parentheses (DD §5). Both are engine-side because the description is canonical text, not authored copy. A NAICS code absent from all three tiers is **Low (1)** per §3.1's own rule, and is additionally reported by the generator so an unintended code is visible.

#### D.2.5 `src/engine/workedExamples.ts`
- **Identity / path:** plain data module.
- **Dependencies:** the engine's types only.
- **Placement:** engine.
- **Responsibility:** carry CRRM §7's twelve worked examples — profile, expected points in attribute order, expected score, expected override, expected rating — as data.
- **Props / configuration:** none.
- **State owned:** none.
- **Lifecycle:** consumed by the phase 2 binary gate and by `check.ts` on every run thereafter.
- **Inputs / outputs:** exports `WORKED_EXAMPLES` and nothing else.

> 🔧 **Implementation Note — this is the gate, and it is binary.** All twelve reproduce exactly, or phase 2 does not exit. Examples 3, 5 and 8 pin the strict-inequality convention; 9 pins the Unacceptable boundary at 4.40; 10, 11 and 12 pin the override as a floor. "Eleven of twelve" is a failure.

---

### D.3 — The data layer

#### D.3.1 `src/data/types.ts`
- **Identity / path:** type-only module.
- **Dependencies:** the engine's rating and band types.
- **Placement:** data.
- **Responsibility:** define `CustomerSource`, `CustomerRecord` (source ∪ derived), `Horizon`, `BusinessLine`, `Rating`, `CustomerQuery`, `SnapshotMeta`.
- **Props / configuration:** none. **State owned:** none. **Lifecycle:** none.
- **Inputs / outputs:** types only; no runtime code, so nothing can import behaviour from it by accident.

**`CustomerRecord` carries no display strings.** No formatted percentage, no "Singapore · 3" cell text, no rating label. Formatting is `lib/format.ts`'s and rendering is the table's; a record that carries its own presentation is a record the interface cannot swap out.

#### D.3.2 `src/data/dataAccess.ts` *(seed contract)*
- **Identity / path:** the interface declared in §C.3, plus nothing else.
- **Dependencies:** `types.ts`.
- **Placement:** data.
- **Responsibility:** be the only shape any component knows about for reading data.
- **Props / configuration:** none. **State owned:** none. **Lifecycle:** none.
- **Inputs / outputs:** `query`, `count`, `meta`.

> **Seed contract — elevated lock (§K.1).** No artifact alters this file without a Coordinator-approved amendment to this TAD, including when the change looks locally sensible.

#### D.3.3 `src/data/fixtureDataAccess.ts`
- **Identity / path:** `createFixtureDataAccess(snapshot): CustomerDataAccess`.
- **Dependencies:** `dataAccess.ts`, `types.ts`. **Not the engine** — the snapshot arrives scored.
- **Placement:** data; constructed once at the composition root.
- **Responsibility:** answer queries by filtering the frozen snapshot.
- **Props / configuration:** the snapshot, injected at construction.
- **State owned:** a memo cache keyed by the serialised query. **This is an optimisation over the single derivation path, not a second store** (§E.1).
- **Lifecycle:** constructed once; never re-created; the snapshot is frozen so the cache can never go stale.
- **Inputs / outputs:** in — `CustomerQuery`. Out — a frozen array. `population: 'intake'` filters `onboardedAt` to `(asOf − windowDays, asOf]`; `population: 'book'` ignores `asOf` and `windowDays` entirely.

#### D.3.4 `src/data/snapshot.ts` *(closes ⚠️ A4)*
- **Identity / path:** `buildSnapshot(): Snapshot`.
- **Dependencies:** `src/generated/fixture.generated.json`, the engine, `types.ts`.
- **Placement:** called by `main.tsx` **before** `createRoot().render()`.
- **Responsibility:** load the fixture, re-score every record with the engine, assert agreement with the stored derivations, freeze the result, and expose `asOf` and provenance.
- **Props / configuration:** none.
- **State owned:** the snapshot, for the process lifetime. The single source of truth (§E.1).
- **Lifecycle:** runs exactly once, synchronously, before React exists. Throws `FixtureLoadError` on a parse failure, a scoring disagreement or a reference-table assertion failure — the build's one error state (§D.5.23).
- **Inputs / outputs:** out — `{ records, asOf, meta }`, deeply frozen with `Object.freeze`.

> 📐 **Design Note — why startup sequencing lives here and not on the interface (⚠️ A4).** DD §8 requires scoring before first paint and forbids lazy-loading the engine behind a spinner, but the data-access interface must not own startup or it acquires a lifecycle a backend implementation could not honour. Splitting them puts the one-time work in a function the composition root calls and leaves the interface a pure query surface. A backend implementation replaces `buildSnapshot` with an `await`ed fetch **before render** and changes no component. Rejected: scoring lazily inside `query()` (first paint would then depend on which surface rendered first); a React `Suspense` boundary (a loading state by another name, forbidden at the exact moment the 12-second criterion is measured).

---

### D.4 — Declarations

#### D.4.1 `src/declarations/types.ts` *(seed contract — the shape)*
- **Identity / path:** type-only module.
- **Dependencies:** the data layer's `Horizon` and `Rating`; nothing else.
- **Placement:** declarations.
- **Responsibility:** define the declaration contract.

```ts
export type ByHorizon<T> = { readonly month: T; readonly quarter: T; readonly year: T };

export type HeroSlot =
  | { readonly kind: 'authored'; readonly value: number | string; readonly unit: string }
  | { readonly kind: 'computed'; readonly resolve: (c: ComputeContext) => HeroValue }
  | { readonly kind: 'absent' };

export type TrendSlot =
  | { readonly kind: 'authored'; readonly value: TrendValue }
  | { readonly kind: 'computed'; readonly resolve: (c: ComputeContext) => TrendValue }
  | { readonly kind: 'absent' };

export type HealthSlot =
  | { readonly kind: 'authored'; readonly value: 'Red' | 'Amber' | 'Green' }
  | { readonly kind: 'absent' };

export interface ElementContent {
  readonly title: string;
  readonly metricHeader: string | null;
  readonly hero: HeroSlot;
  readonly trend: TrendSlot;
  readonly health: HealthSlot;
  readonly feedCaption: string;
}

export interface ModuleDeclaration {
  readonly id: string;
  readonly status: 'live' | 'inactive';
  readonly placement: { readonly band: BandId; readonly group: string | null; readonly order: number };
  readonly content: ByHorizon<ElementContent>;
  readonly legend: readonly LegendEntry[];
  readonly schema: DeclarationSchema;
  readonly alignment?: RegulatoryAlignment;
  readonly surface?: React.ComponentType;   // live modules only
}
```
- **State owned:** none. **Lifecycle:** none.
- **Inputs / outputs:** types consumed by the registry, the loader, the shell and the live module.

**Two decisions inside this file that close open questions.**

**Every element is horizon-keyed, and health is always a `ByHorizon<HealthSlot>`.** DD §5 leaves open whether health is *"always a map that happens to be single-valued for inactive modules, or two shapes."* It is always a map. One shape for all 26 (DD §2's own implementation note), the workbooks already author health per horizon in three files, and a second shape would exist solely to save twenty-five duplicated values — buying nothing and costing a branch in every consumer.

**`computed` is a slot kind, not a magic value.** The workbooks carry the string `computed` in `Hero value` and `Trend`; that string is *transcription vocabulary* and does not survive into the runtime type. A slot is `authored`, `computed` or `absent`, discriminated, and the compiler makes an exhaustive switch mandatory in every renderer. *Rejected: a sentinel string in the value field — `'computed'` would then be assignable wherever a number is expected and would eventually reach a formatter and render as the word. Also rejected: a parallel `source: 'authored' | 'computed'` flag, which permits the illegal combination `{source:'computed', value: 42}`.*

**A computed slot carries a function, so only a code module can have one.** Generated JSON cannot hold a function, which makes "only a live module computes" a property of the file format rather than a rule anyone has to remember.

#### D.4.2 `src/declarations/schema.ts` *(seed contract)*
As specified in §C.2. Exports `DEFAULT_SCHEMA_ROW_LABELS` and `defaultSchema()`. Its only consumer in this build is `D.6.1`, which attaches an unpopulated schema to the live module, and `D.4.5`, which attaches one to each inactive module. Nothing renders it.

#### D.4.3 `src/declarations/registry.ts` *(seed contract)*
- **Identity / path:** exports `moduleRegistry: readonly ModuleDeclaration[]`.
- **Dependencies:** `load.ts`, `src/modules/kyc-intake/declaration.ts`.
- **Placement:** declarations; imported by `Board` and `ProgramElementSelector`.
- **Responsibility:** be the one list. Twenty-five loaded, one imported, concatenated, sorted by `placement.order`.
- **Props / configuration:** none. **State owned:** none — module-scope constant. **Lifecycle:** evaluated once at import.
- **Inputs / outputs:** out — the array. **Nothing else in the build enumerates elements.**

> 🔧 **Implementation Note — the mechanical claim.** `check.ts` asserts that no file under `src/shell/` contains any element id, any element title, or any group name (§L.3). That is what *"the shell contains no tile-specific code"* means in a form a grep can decide.

#### D.4.4 `src/declarations/contexts.ts` *(closes ⚠️ A17, part)*
- **Identity / path:** exports `boardContext: ContextDeclaration`.
- **Dependencies:** `types.ts`.
- **Placement:** declarations.
- **Responsibility:** give the Board the same declared surface a module has, so the frame can render legends uniformly.

```ts
export interface ContextDeclaration {
  readonly id: string;                       // 'board' or a module id
  readonly horizonLegend: ByHorizon<string>; // DD §2's two wordings
  readonly legend: readonly LegendEntry[];
}
export type LegendEntry =
  | { kind: 'health-and-trend'; label: string; markMeans: string; arrowMeans: string }
  | { kind: 'rating-ramp';      label: string; steps: readonly { rating: Rating; label: string }[] };
```
- **State owned:** none. **Lifecycle:** constant.
- **Inputs / outputs:** consumed by `HorizonLegend` and `MarkLegend`.

> 📐 **Design Note — why the Board gets a declaration although it is not a module (⚠️ A17).** The frame renders legend content for *whatever context is active*, and the Board is a context. Giving the Board a declaration of the same shape means the frame has one code path rather than a branch on "is this the board." The `LegendEntry` union then lets a module supply a rating ramp where the Board supplies two mark-and-arrow entries, with the shell rendering by `kind` and never knowing which module supplied what. Rejected: hardcoding the Board's legend in `MarkLegend` — it would put two of the board's most load-bearing strings inside the shell, which is the tile-inventory failure at a smaller scale.

#### D.4.5 `src/declarations/load.ts`
- **Identity / path:** `loadInactiveDeclarations(): readonly ModuleDeclaration[]`.
- **Dependencies:** `src/generated/declarations.generated.json`, `types.ts`, `schema.ts`.
- **Placement:** declarations; called once at import time by the registry.
- **Responsibility:** parse the generated JSON into typed declarations, attach `defaultSchema()` to each, and re-run the generator's gate conditions at runtime.
- **Props / configuration:** none.
- **State owned:** none.
- **Lifecycle:** once, at module evaluation, synchronously, before render.
- **Inputs / outputs:** throws `DeclarationLoadError` — surfaced as the one error state — if the data is malformed, an enum is unrecognised, or the element count is not 26.

> 📐 **Design Note.** The generator already validated this data, so the runtime re-check looks redundant. It is not: the generated file is committed and a human can edit it. Re-validating at load turns *"someone hand-edited a generated file"* from a mystery on screen into a named error, which is the failure mode DD §1 asks the architecture to design against.


---

### D.5 — The shell

#### D.5.1 `src/main.tsx` *(the composition root)*
- **Identity / path:** the entry module `index.html` loads.
- **Dependencies:** `design/tokens.css` (first import, always), `data/snapshot.ts`, `data/fixtureDataAccess.ts`, `App.tsx`.
- **Placement:** the top of the graph; nothing imports it.
- **Responsibility:** build the snapshot, construct the data-access implementation, inject it, and render. **This is the one place a fixture becomes an API later.**
- **Props / configuration:** none.
- **State owned:** none that outlives the call.
- **Lifecycle:** runs once. In order, synchronously: import tokens → `buildSnapshot()` → `createFixtureDataAccess(snapshot)` → `createRoot().render(<App data={...} />)`. If `buildSnapshot()` throws, render `<FixtureErrorState/>` instead and stop.
- **Inputs / outputs:** none in; the mounted application out.

> 🔧 **Implementation Note.** Nine or ten lines, and they are the most consequential in the build. Scoring completes before React exists, so no surface can render before the numbers do and **no loading state is representable**. When a backend arrives, this function gains an `await` above `createRoot` and nothing else in the repository changes — which is the seed contract's whole claim, made checkable by inspecting one file.

#### D.5.2 `src/App.tsx`
- **Identity / path:** the application root component.
- **Dependencies:** `DataAccessProvider`, `SessionStateProvider`, `CanvasRoot`, `Shell`, `OverflowSentinel`.
- **Placement:** rendered by `main.tsx`.
- **Responsibility:** compose the providers in one readable place and hold the error boundary.
- **Props / configuration:** `{ data: CustomerDataAccess }`.
- **State owned:** none.
- **Lifecycle:** an error boundary catching render-time failures into `FixtureErrorState`.
- **Inputs / outputs:** provides the data access and session state to everything below.

#### D.5.3 `CanvasRoot` *(closes ⚠️ A11, part)*
- **Identity / path:** `src/shell/CanvasRoot.tsx`.
- **Dependencies:** `design/canvas.css`.
- **Placement:** wraps everything visible.
- **Responsibility:** hold the fixed 1920 × 1080 box and keep `--canvas-scale` correct.
- **Props / configuration:** `children`. Dimensions come from `--canvas-width` / `--canvas-height`; **it hardcodes neither.**
- **State owned:** the current scale factor.
- **Lifecycle:** sets scale on mount from `min(innerWidth/1920, innerHeight/1080)`; recomputes on `resize`; removes the listener on unmount. The initial value is computed **before first paint** in a layout effect so the board never paints at the wrong size.
- **Inputs / outputs:** in — viewport dimensions. Out — a CSS custom property on its own node.

> 📐 **Design Note.** Uniform scale rather than reflow, per the frozen Form. `overflow: hidden` on a fixed-height root makes the no-scroll commitment structural: there is no scroll container anywhere in the application, on any surface, so the board cannot grow past its height and a phone gets the whole board small rather than a degraded subset. Rejected: CSS zoom (inconsistent across engines); a fluid type ramp (a breakpoint set to design and maintain, which the direction's build-cost posture rules out).

#### D.5.4 `SessionStateProvider` *(closes ⚠️ A16, ⚠️ A20)*
- **Identity / path:** `src/shell/SessionStateProvider.tsx`.
- **Dependencies:** React only.
- **Placement:** above `Shell`.
- **Responsibility:** hold the three things that must survive navigation, and nothing else.

```ts
interface SessionState {
  activeContext: string;                       // 'board' or a module id
  horizonByContext: Record<string, Horizon>;   // each defaults to 'month'
  moduleState: Record<string, unknown>;        // OPAQUE to the shell
}
```
- **Props / configuration:** `children`.
- **State owned:** all three fields, for the session. Nothing persists beyond a reload — there is no persistence in this build by design.
- **Lifecycle:** created once; never reset.
- **Inputs / outputs:** exposes `useActiveContext()`, `useContextHorizon()` and `useModuleSession<T>(moduleId, initial)`.

> 📐 **Design Note — one seam, used three times (⚠️ A16, ⚠️ A20).** DD §2 states the seam directly: *the shell owns the widget, the active context owns the value.* The same seam governs the Time Horizon control, the mark legend, and now module state. `moduleState` is typed `unknown` and read only through `useModuleSession<T>`, so **the shell provides storage and never inspects the shape** — a module could change its entire state model without the shell recompiling. The horizon is deliberately *not* inside `moduleState`, because the shell's control must read and write it; keeping it in a separate map keyed by context is what lets one widget serve two contexts without either knowing about the other. *Rejected: keeping module state inside the module with `useState` — it dies on unmount, and DD §4 requires it to survive leaving and re-entering. Also rejected: keeping it mounted and hidden — the Board replaces the module by design, and a hidden mounted module would keep querying.*

#### D.5.5 `Shell`
- **Identity / path:** `src/shell/Shell.tsx`.
- **Dependencies:** `NavigationFrame`, `Board`, `moduleRegistry`.
- **Placement:** inside `CanvasRoot`.
- **Responsibility:** lay the persistent frame beside the content area and render the active context into the content area.
- **Props / configuration:** none.
- **State owned:** none; reads `activeContext`.
- **Lifecycle:** switching context unmounts the previous content. The frame never unmounts.
- **Inputs / outputs:** renders `<Board/>` when active context is `board`; otherwise renders that module's declared `surface` component. **The lookup is `moduleRegistry.find(m => m.id === activeContext)?.surface` — the shell names no module.**

> 📐 **Design Note (⚠️ A15).** The frame is application chrome, not a region of the board, so it sits outside the content area in the component tree as well as on screen. That is the module boundary made structural: the frame cannot accidentally depend on board state, and a module cannot accidentally render chrome.

#### D.5.6 `NavigationFrame`
- **Identity / path:** `src/shell/NavigationFrame.tsx`.
- **Dependencies:** `ProgramElementSelector`, `TimeHorizonControl`, `HorizonLegend`, `MarkLegend`, `AboutAffordance`.
- **Placement:** the left 288 canvas of `Shell`, persistent.
- **Responsibility:** render the four frame elements in DD §5's order and nothing else.
- **Props / configuration:** none. Its width is `var(--frame-width)`.
- **State owned:** none. **Lifecycle:** mounted for the session.
- **Inputs / outputs:** none of its own.

#### D.5.7 `ProgramElementSelector`
- **Identity / path:** `src/shell/ProgramElementSelector.tsx`.
- **Dependencies:** `moduleRegistry`, `useActiveContext`.
- **Placement:** frame, first.
- **Responsibility:** 27 entries — the Board, then the 26 elements alphabetically by title — of which the Board and any `status: 'live'` module are selectable and the rest greyed, unselectable and not focusable.
- **Props / configuration:** none.
- **State owned:** its own open/closed state.
- **Lifecycle:** closes on selection, on Escape and on blur.
- **Inputs / outputs:** out — sets `activeContext`. Selecting the currently active context is a no-op (DD Appendix D.1).

> 🔧 **Implementation Note.** Selectability is derived from `status`, never from an id list. When a second module goes live it becomes selectable with no change here — which is the module registry demonstrated as a navigable inventory (DD §4).

#### D.5.8 `TimeHorizonControl` *(closes ⚠️ A16)*
- **Identity / path:** `src/shell/TimeHorizonControl.tsx`.
- **Dependencies:** `useContextHorizon`.
- **Placement:** frame, second. One control, one label, one position.
- **Responsibility:** display and set the horizon **of whichever context is active**.
- **Props / configuration:** none.
- **State owned:** none — the value lives in `SessionStateProvider`, keyed by context.
- **Lifecycle:** re-renders when the active context or its horizon changes.
- **Inputs / outputs:** in — `horizonByContext[activeContext]`. Out — writes to the same key only. **It is structurally incapable of writing to another context's value**, which is DD §2's "neither ever writes to the other" enforced rather than remembered.

#### D.5.9 `HorizonLegend`
- **Identity / path:** `src/shell/HorizonLegend.tsx`.
- **Dependencies:** `boardContext`, `moduleRegistry`, `useActiveContext`.
- **Placement:** frame, beneath the control. Static, non-interactive, not in the tab order.
- **Responsibility:** render the active context's `horizonLegend[horizon]` string.
- **Props / configuration:** none. **State owned:** none. **Lifecycle:** stateless.
- **Inputs / outputs:** in — one declared string. Out — text. It composes no sentence of its own; both wordings are authored (DD §2) and deliberately structurally different so they cannot be collapsed by accident.

#### D.5.10 `MarkLegend` *(closes ⚠️ A17)*
- **Identity / path:** `src/shell/MarkLegend.tsx`.
- **Dependencies:** `HealthMark`, `TrendGlyph`, the active context's declaration.
- **Placement:** frame, beneath `HorizonLegend`.
- **Responsibility:** render the active context's declared `LegendEntry[]`, switching on `kind` and never on identity.
- **Props / configuration:** none. **State owned:** none.
- **Lifecycle:** stateless.
- **Inputs / outputs:** in — the declared entries. Out — two entries on the Board, one rating ramp inside the module.

> 🔧 **Implementation Note — the strings are final, and the frame does not move.** Per **DD v0.9.4 Appendix A.4**, confirmed 21 August 2026, the Board's two entries render as ***Business Risk*** and ***Control Risk***. Touch Two's short-form authorisation (*Effectiveness Risk*) is **superseded, not retained** — there is no fallback, no width contingency and no ladder, so nothing about the frame is decided at the phase 1 exit. **The frame width stands at 288 canvas** as derived at Touch Two, and the difference between that measurement and the shorter final labels is **not recovered**: narrowing the frame widens the register's three 509-canvas columns and re-opens a layout that is settled. Hard lock (§K.2.12).

> 🔧 **Implementation Note — the rendered label is not the descriptive term, deliberately.** The legend renders *Control Risk*; the DD continues to describe the encoding as *control effectiveness risk* where it is describing the encoding rather than naming the string (DD v0.9.4 §5). **The build renders the label; the description beside it is the entry's declared `markMeans` text and is unchanged.** An Author encountering both phrases has not found a discrepancy.

#### D.5.11 `AboutAffordance` / #### D.5.12 `AboutModal`
- **Identity / paths:** `src/shell/AboutAffordance.tsx`, `src/shell/AboutModal.tsx`.
- **Dependencies:** `about.ts` — the approved copy as a data module (§H.5).
- **Placement:** frame, last; the modal renders in a portal above everything.
- **Responsibility:** trigger, and the one overlay in the build.
- **Props / configuration:** the modal takes `{ open, onClose }`.
- **State owned:** the affordance owns `open`.
- **Lifecycle:** **the only focus trap in the build.** Focus moves in on open and is trapped; closes on the dismiss control, on click outside, and on Escape; focus returns to the affordance; the underlying surface is unchanged in every respect (DD Appendix D.4). Motion uses `--motion-reveal`, which is `0ms` under `prefers-reduced-motion`.
- **Inputs / outputs:** in — approved copy, **pasted verbatim, never edited and never reflowed to fit. If the text does not fit, the modal changes.** Go-live gate (§J.6).

#### D.5.13 `Board`
- **Identity / path:** `src/shell/Board.tsx`.
- **Dependencies:** `moduleRegistry`, `bands`, `BandLabel`, `TileBand`, `RegisterField`.
- **Placement:** the content area when the active context is `board`.
- **Responsibility:** for each band in order, render its label block and then its elements in that band's presentation.
- **Props / configuration:** none.
- **State owned:** none. Reads the Board's horizon.
- **Lifecycle:** stateless; re-renders on horizon change, when all 26 elements re-read `content[horizon]`.
- **Inputs / outputs:** in — the registry and the band registry. Out — the board.

> 🔧 **Implementation Note (⚠️ A9).** The band determines presentation: `bands.find(b => b.id === decl.placement.band).presentation` selects `ElementTile` or `RegisterRow`. **No element declares a presentation and no slot exists in one presentation and not the other** — which is what keeps two components from becoming two contracts. The two components differ in arrangement only, and both consume the identical `ElementContent`.

#### D.5.14 `BandLabel`
- Renders a band's label in the 48-canvas label block at `--type-band-label`, caps, `--tracking-band-label`. Props: `{ label }`. No state. Its height is a compression lever (§K.2) and must stay at nominal until the phase 1 check.

#### D.5.15 `TileBand`
- **Responsibility:** lay out the elements whose band draws as tiles — two, side by side, in the 140-canvas band, at the strongest position. Props: `{ declarations }`. No state. It counts what it is given and does not know the count is two.

#### D.5.16 `RegisterField` *(closes ⚠️ A8, ⚠️ A10)*
- **Identity / path:** `src/shell/RegisterField.tsx`.
- **Dependencies:** `RegisterRow`.
- **Placement:** the second band.
- **Responsibility:** lay the register's elements into three columns of two-line rows, starting a fresh row whenever the declared group changes.
- **Props / configuration:** `{ declarations }` in registry order.
- **State owned:** none.
- **Lifecycle:** stateless.
- **Inputs / outputs:** in — declarations. Out — the register.

**The fresh-row rule, generically (⚠️ A8).** Walk the declarations in order; whenever `placement.group` differs from the previous element's, start a new row; pack up to three elements per row; separate groups by `--register-group-gap` and rows within a group by `--register-row-gap`. **The shell never names a group and never counts one.** Group order is the order of first appearance in the registry, so re-ordering groups is re-ordering declarations.

**Cross-row field alignment (⚠️ A10).** Every register row is a CSS grid on a **fixed column template** — `var(--mark-size) var(--register-title-width) 1fr var(--trend-size)` — so all 24 rows align by construction, in all three columns, with nothing measuring anything.

> 📐 **Design Note.** DD §5 requires the title field to be *"sized once to the longest title and every row honours it"* while the shell must not inspect content. A fixed token satisfies both: the sizing decision was made once, at Touch Two, from the known content, and the shell simply honours it. *Rejected: a runtime measurement pass — it needs a layout pass before paint, which the pre-paint commitment forbids. Rejected: CSS `subgrid` — it would align rows within a column, not across all 24, which is the requirement.* **`--register-title-width` does not yet exist in `fcc-tokens.css`;** it is requested as a Touch Two addition and carried provisionally at **232 canvas** until confirmed (§F.10, §L.1).

#### D.5.17 `ElementTile` / #### D.5.18 `RegisterRow`
- **Identity / paths:** `src/shell/ElementTile.tsx`, `src/shell/RegisterRow.tsx`.
- **Dependencies:** `HealthMark`, `TrendGlyph`, `HeroValue`, `ScrimLayer`, `design/elements.css`.
- **Placement:** inside `TileBand` and `RegisterField` respectively.
- **Responsibility:** render one element's `ElementContent` in one arrangement.
- **Props / configuration:** `{ declaration, horizon, onActivate? }`.
- **State owned:** none.
- **Lifecycle:** live tiles are focusable, hoverable and activate on click or Enter/Space. **Inactive elements are not focusable, carry no hover affordance and no cursor change, and are not in the tab order** — in every state, at every horizon (DD Appendix D.0).
- **Inputs / outputs:** in — `content[horizon]` plus `status`. Out — an activation callback, live only.

**Slot rendering is an exhaustive switch on `kind`.** `absent` renders **nothing at all** — no placeholder, no dash, no reserved space (Design System spec §5). That single rule produces the process element's treatment, the missing-trend treatment, and the empty-hero treatment, without any of the three being a special case.

**The zero-value case is not a variant.** A hero of `0` renders at full size, weight and colour, identically to `42`. There is no branch on the value, which is what makes the treatment impossible to get wrong.

#### D.5.19 `HealthMark` *(closes ⚠️ A12)*
- **Identity / path:** `src/shell/HealthMark.tsx`.
- **Dependencies:** tokens only.
- **Placement:** leading position — left-most on a register row, top-left on a tile. One position across both presentations.
- **Responsibility:** render the Harvey ball whose **fill quantity carries severity redundantly with hue**.
- **Props / configuration:** `{ value: 'Red' | 'Amber' | 'Green' }`. No colour prop, no size prop.
- **State owned:** none.
- **Lifecycle:** stateless SVG at `--mark-size` with `--mark-stroke`.
- **Inputs / outputs:** in — the value. Out — filled circle (Red) · half-filled circle (Amber) · open circle (Green).

> 🔧 **Implementation Note — why this is flagged at all.** The Coordinator's E2 ruling rests the scrimmed mark's defensibility on **shape redundancy rather than the contrast number**, and the ramp is deliberately not darkened. A component that renders the mark as a coloured dot satisfies the token file and breaks the ruling — silently, because it would look fine. Shape and colour are therefore derived from the same single prop by one exhaustive switch, so a mark cannot exist with the right hue and the wrong form. `check.ts` additionally asserts that `HealthMark.tsx` is the **only** file referencing `--status-red|amber|green` (§L.3).

#### D.5.20 `TrendGlyph`
- Solid triangular glyph with a short stem, `--trend-size`, `--trend-ink` (primary, not secondary — it has lost colour's redundancy), rotated by `--trend-rotation-{rising|flat|falling}`. Props `{ value }`. **Never takes status colour.** Absence is handled by the caller not rendering it, per the `absent` rule above. Vocabulary is `Increasing · Stable · Decreasing`, carried verbatim from the workbooks; the value is **never displayed as text** — its only worded expression is the frame's legend entry.

#### D.5.21 `HeroValue`
- Renders a hero number and its unit as one token, via `lib/format.ts`. Props `{ value, unit }`. Tabular lining figures are a property of the face, so a horizon change cannot make a column jitter. No branch on zero, no branch on magnitude.

#### D.5.22 `ScrimLayer` *(closes ⚠️ A22, part)*
- **Identity / path:** `src/shell/ScrimLayer.tsx` plus one class in `design/elements.css`.
- **Dependencies:** tokens.
- **Placement:** wraps the content of any element whose `status` is `inactive` — **per element, never per region** (Design Direction brief §6).
- **Responsibility:** be the **one place in the build where the scrim exists**, and the one place the primary-ink rule is applied.
- **Props / configuration:** `{ children }`. It reads `--scrim` and `--scrim-opacity` and defines neither.
- **State owned:** none.
- **Lifecycle:** stateless. Its transition uses `--motion-state`.
- **Inputs / outputs:** in — an element's rendered content. Out — the same content, veiled, with `color: var(--ink-primary)` applied to the subtree.

> 🔧 **Implementation Note — the counter-intuitive rule, made structural.** Secondary ink measures 3.75:1 through the scrim and **fails AA**; primary measures 5.95:1. A scrimmed element therefore sets its metric header and feed caption in the *darker* ink, which is the opposite of what anyone would reach for. Rather than trust twenty-four call sites to remember, the rule lives in one class that owns the scrim, and `check.ts` asserts that `--ink-secondary` appears in no file under `src/shell/` (§L.3). *There is no legitimate use of secondary ink on the board:* the live tile is unscrimmed and sets primary throughout.

#### D.5.23 `FixtureErrorState`
- The build's **one** error state. Renders the approved line — *There seems to be a problem, please reload or try again.* — in place of the program field, with the frame intact. Reachable only from a `FixtureLoadError`, a `DeclarationLoadError` or a reference-table assertion failure. Every other error state is absent because there is nothing else that can fail (DD §3).

#### D.5.24 `OverflowSentinel` *(closes ⚠️ A11 — runs in development **and** against the deployed board)*
- **Identity / path:** `src/shell/OverflowSentinel.tsx`.
- **Dependencies:** none.
- **Placement:** rendered by `App` in two circumstances and no others: **always in development**, and **in any build when the URL carries `?fit-check=1`**.
- **Responsibility:** after layout, walk every element box and report anything whose `scrollWidth` or `scrollHeight` exceeds its client box.
- **Props / configuration:** none. Activation is `import.meta.env.DEV || new URLSearchParams(location.search).has('fit-check')`.
- **State owned:** the current list of offenders.
- **Lifecycle:** a layout effect after mount and after every horizon change; a `ResizeObserver` on the canvas root. **Renders nothing whatsoever when inactive** — no banner, no wrapper, no attribute, no console output.
- **Inputs / outputs:** out — when active, a fixed banner listing offenders **by element id and field** (*"Governance · line 2 · 640 of 485"*), plus a console table. When there are none, an explicit *"fit check: 26 elements, no overruns"* line, so a silent pass is distinguishable from a check that did not run.

> 📐 **Design Note — why this ships to production rather than staying local *(Designer note, 21 August 2026, accepted)*.** The canvas root is `overflow: hidden`, so in production an overrun **clips silently** — which is precisely the invisible failure A11 exists to prevent. A development-only sentinel therefore guards the wrong environment: local dev is not where the real font, the real strings and the real scale meet. Gating on a query string keeps the artifact clean for every visitor who does not type one — a forwarded link, a partner meeting, a screenshot — while making the check runnable against the deployed board at any time, including after a content edit made months from now. **Rejected: a separate build mode or an environment variable** — both add a deploy-time variable to a pipeline that deliberately has none (§B.4), and both produce an artifact that is not the artifact being shipped, which is the one property this check needs. **Rejected: leaving it development-only** — the Designer's objection stands and there is no answer to it.

> 🔧 **Implementation Note.** The sentinel is the authoritative fit check; the character budgets in D.1.1 are only its early warning. It must be run **at all three Board horizons**, because hero values differ by horizon and a wider number changes line 1's fit. The measurement is exact — the real strings in the real font at the real scale — which no build-time estimate can match.

---

### D.6 — The customer intake module

*One folder. Its metrics, surfaces, state, legend, alignment and declaration live together; the shell mounts it and knows nothing else about it.*

#### D.6.1 `src/modules/kyc-intake/declaration.ts`
- **Identity / path:** exports `customerIntakeModule: ModuleDeclaration`.
- **Dependencies:** the generated declaration for `customers`; `selectors.ts`; `CustomerIntakeModule`; `defaultSchema`.
- **Placement:** imported by the registry.
- **Responsibility:** merge the Coordinator's authored board content with the module's capabilities into one declaration of the same type as the other twenty-five.
- **Props / configuration:** none.
- **State owned:** none.
- **Lifecycle:** constant, evaluated at import.
- **Inputs / outputs:** out — a declaration whose `hero` and `trend` are `computed` slots carrying resolvers, whose `health` is the authored `ByHorizon` map, whose `legend` is the rating ramp, whose `alignment` carries the methodology reference, and whose `surface` is the module component.

**The computed resolvers, precisely.** `hero.resolve({horizon, data})` returns the **Board's as-at** High share — `data` queried at `asOf = today − {0,90,365}` with `windowDays: 30` — because the Customers tile is a Board surface (DD §5, Reviewer F-23, BLOCKING). It is **not** the module's trailing-window aggregate. `trend.resolve` compares that figure against the same query one period earlier and returns `Increasing | Stable | Decreasing`.

> 🔧 **Implementation Note — the phase 1 stub.** Phase 1 ships a full board before the engine exists (§J.1). The resolvers are therefore implemented first as constants returning DD §3's figures — 11.0% / ~6.3% / ~4.8% — and replaced with the real queries in phase 3. **The declaration's shape does not change**, which both lets phase 1 verify a complete board and proves the binding indirection does its job. The stub file is deleted in phase 3, not left behind.

#### D.6.2 `CustomerIntakeModule`
- **Identity / path:** `src/modules/kyc-intake/CustomerIntakeModule.tsx`.
- **Dependencies:** `moduleState.ts`, `selectors.ts`, `Comparison`, `RecordsPanel`, `useModuleSession`, `useContextHorizon`, the data access.
- **Placement:** mounted into the content area by `Shell` when it is the active context.
- **Responsibility:** own the module's state and lay the Comparison above the Records.
- **Props / configuration:** none. The shell passes nothing; a module that needed props from the shell would not be a module.
- **State owned:** its state object, held through `useModuleSession('kyc-intake', initialState)` so it survives leaving and re-entering; and its horizon through `useContextHorizon('kyc-intake')`, which **initialises to Month on first entry regardless of the Board's value** (DD §2).
- **Lifecycle:** unmounts on return to the Board; its state does not.
- **Inputs / outputs:** in — the data access, its horizon, its retained state. Out — nothing to the shell.

#### D.6.3 `moduleState.ts` *(closes ⚠️ A18, ⚠️ A19, ⚠️ A20)*
- **Identity / path:** a reducer and its state type.
- **Dependencies:** the data layer's types.
- **Placement:** module.
- **Responsibility:** hold selection, filter and page as **one object with one reducer**, so they cannot disagree.

```ts
interface KycState {
  selectedLine: 'book' | BusinessLine | null;   // null = nothing selected
  rating: Rating | 'All';                       // default 'High'
  page: number;                                 // 1-based
}
```
- **Props / configuration:** none. **Lifecycle:** stored opaquely by `SessionStateProvider`.
- **Inputs / outputs:** actions — `selectLine`, `deselect`, `setRating`, `setPage`.

**Three invariants the reducer guarantees (⚠️ A19).** The Records panel is visible **iff** `selectedLine !== null`; the Comparison is full-height **iff** `selectedLine === null`. Selection, panel visibility and Comparison height are therefore **one piece of state with two derivations**, not three that can drift. `selectLine` on the already-selected line is `deselect` — closing the panel, deselecting and re-expanding are one action, identical to the close control (DD §3). And `page` resets to 1 whenever the result set's identity changes — a line change, a filter change or a horizon change.

> 🔧 **Implementation Note — one detail the DD left implicit.** Appendix D.3 pins the page reset on a *filter* change. A line change and a horizon change also change the result set, so page resets there too; the alternative is landing on page 3 of a one-page result. Recorded here as a reducer invariant rather than escalated, since it decides nothing the DD decided differently.

#### D.6.4 `selectors.ts`
- **Identity / path:** pure functions over `CustomerDataAccess`.
- **Dependencies:** the data access interface; the data types. **No React, no components.**
- **Placement:** module.
- **Responsibility:** every derivation the module's surfaces display — the book's composition, per-line compositions, intake compositions per horizon, the as-at High share, the record page.
- **Props / configuration:** none.
- **State owned:** **none. Every value is computed on render from `query()` results and never separately stored** (DD §8).
- **Lifecycle:** stateless; memoised with `useMemo` on `(horizon, line, rating, page)` where profiling warrants, as an optimisation over the single derivation path.
- **Inputs / outputs:** in — the data access and the current state. Out — plain numbers and arrays, no display strings.

> 🔧 **Implementation Note.** Composition is `count(rating) / count(all)` per population, from the same `count()` primitive. There is no aggregate anywhere in the fixture, no stored share and no cached percentage — which is why a knob moving in phase 2 cannot leave a stale number on a surface.

#### D.6.5 `Comparison` *(closes ⚠️ A18, part)*
- **Identity / path:** `src/modules/kyc-intake/Comparison.tsx`.
- **Dependencies:** `CompositionBar`, `selectors.ts`, `MethodologyLabel`.
- **Placement:** the module's upper region.
- **Responsibility:** render **eight bars in four pairs** at full height, or **four bars** collapsed, and take a line selection.
- **Props / configuration:** `{ state, dispatch }`.
- **State owned:** none.
- **Lifecycle:** the collapse uses `--motion-collapse`; under `prefers-reduced-motion` it is an instant reflow, so **the selected-line state must be readable from the static layout alone** — weight, a left rule and a position marker, per Design System spec §8.3.
- **Inputs / outputs:** in — derived compositions. Out — `selectLine`.

> 🔧 **Implementation Note — the collapse changes content, not size.** Collapsed, the per-line *book* bars drop out and the line rows become single-composition bars; the whole-book anchor persists in both states (DD §5). It is a content transition that happens to animate, not a CSS height animation over the same content.

#### D.6.6 `CompositionBar`
- One 100% stacked composition of High / Medium / Low with **High anchored at the left edge**, so every High segment starts at the same point and is comparable down the column. Props `{ label, composition, selected, onSelect }`. Fills are `--risk-bar-{high|medium|low}`; labels are always present (Rule E). **Built from flex children with percentage widths — there is no chart library** (§F.23).

#### D.6.7 `MethodologyLabel` *(the traceability moment — go-live gate)*
- Renders the module's declared `alignment`: the governing document (*Customer Risk Rating Methodology*) alongside the regulatory expectation it answers to (the FFIEC BSA/AML Examination Manual's Customer Due Diligence section, per CRRM §1). Props: none — it reads the declaration. **This is the one visible instance of regulatory traceability the build ships**, and its presence is a definition-of-done item. It is declared, not hardcoded, so a second module carries its own.

#### D.6.8 `RecordsPanel` *(closes ⚠️ A21)*
- **Identity / path:** `src/modules/kyc-intake/RecordsPanel.tsx`.
- **Dependencies:** `RecordTable`, `RatingFilter`, `Pagination`, `selectors.ts`.
- **Placement:** the module's lower region, present iff a line is selected.
- **Responsibility:** the four record states — populated, sparse, paginated, empty-for-filter — and the count header.
- **Props / configuration:** `{ state, dispatch }`.
- **State owned:** none; page lives in `KycState`.
- **Lifecycle:** opens on selection with `--motion-reveal`; the close control deselects, closes and re-expands as one action.
- **Inputs / outputs:** in — the full result array from `selectors.ts`; it slices 25 per page itself. **Page size lives here, not on the data-access interface** — a presentational concern kept out of the contract.

**Sparse is not a variant.** One row renders in the same table as twenty, with the header explaining why. There is no "not much here" treatment.

#### D.6.9 `RecordTable`
- Eleven columns in DD §5's order: Reference · Customer · Entity type · Industry · Product · Jurisdiction · TM alerts · Score · Rating · Route · PEP. Band and points share a cell so the arithmetic reads across the row. Industry renders **description then code in parentheses**, from `industryDescription()`. The Customer cell is the **redaction treatment** — a greyed field with no display text. The Rating cell carries `--risk-text-{high|medium|low}` as a **tint on the word, never a wash behind it**; nothing else on the surface takes colour. Rows are display-only, not focusable, and the table is not a scroll region. **Attribute weights never appear** (DD §5, Coordinator domain ruling).

#### D.6.10 `RatingFilter`
- All / Low / Medium / High, defaulting to High. Module-owned; persists across line changes, across closing and reopening the panel, and across leaving and re-entering the module. Dispatches `setRating`, which resets `page`.

#### D.6.11 `Pagination`
- Present **only** when the result exceeds 25, absent otherwise — so the signature view (Commercial / High / Month, 20 ± 3 records) is one clean page with no controls at the moment they would most distract. Renders the position line (*Showing 1–25 of 1,728*) and first/last disabled states. A quiet prompt toward the horizon and rating filters appears when the result runs to many pages.

---

### D.7 — Shared

#### D.7.1 `src/lib/format.ts`
- Every number-to-string conversion in the build: percentages to one decimal, scores to two, counts with thousands separators, the value-and-unit token. **No component formats a number inline**, so the fixed conventions cannot drift between the tile, the comparison and the table.

#### D.7.2 `src/design/*.css`
- `tokens.css` is `fcc-tokens.css` **verbatim, never edited**. `canvas.css` holds §C.5's three rules. `elements.css` holds the scrim class, the register grid template and the tile arrangement — all expressed in tokens. Imported once, in `main.tsx`, before anything else.


---

## E. State & Data Flow

### E.1 Where state lives

| State | Owner | Mechanism | Consumers | Rationale |
|---|---|---|---|---|
| The scored population | `snapshot.ts` | module-scope constant, deeply frozen | everything, via the data access only | one source of truth; frozen so no consumer can write to it |
| The data-access implementation | `main.tsx` | constructed once, provided by context | every surface | the one injection point a backend later replaces |
| Module declarations | `registry.ts` | module-scope constant | `Board`, `ProgramElementSelector`, `Shell` | the board's only inventory |
| Active context | `SessionStateProvider` | `useReducer` | `Shell`, frame controls | one value decides what the frame governs |
| Horizon per context | `SessionStateProvider` | `Record<contextId, Horizon>` | `TimeHorizonControl`, `Board`, the module | one widget, two independent values; neither can write to the other |
| Module state (line, filter, page) | the module, stored opaquely by `SessionStateProvider` | `Record<moduleId, unknown>` + `useModuleSession<T>` | the module only | survives leaving and re-entering; the shell never inspects the shape |
| Dropdown / modal open state | the component that owns the widget | `useState` | itself | ephemeral, unshared, and correctly discarded |
| Query memo cache | `fixtureDataAccess` | `Map` keyed by serialised query | itself | an optimisation over the single derivation path, not a second store |

**Standing rule.** Derived values are computed on render from the sources above and are **never separately stored** (DD §8). There is no aggregate, no cached share, no precomputed horizon slice. Any memo is an optimisation over that rule; because the snapshot is frozen, a memo cannot go stale.

### E.2 The core loop (the spine)

```
user changes Time Horizon (or clicks a line, or sets a filter)
  → SessionStateProvider writes ONE value, scoped to the active context
  → the active surface re-reads
       Board:  every declaration's content[horizon]  (25 authored, 1 computed)
       Module: selectors → dataAccess.query({population, asOf, windowDays, line, rating})
  → fixtureDataAccess filters the frozen snapshot
  → selectors derive shares, compositions and the record page on render
  → the surfaces re-render; nothing is written back
```

> 🔧 **Implementation Note — what this shape enforces structurally.** The snapshot is frozen, so **nothing downstream can write to the fixture**. There is exactly one derivation path from records to displayed numbers, so **a displayed metric cannot drift from the engine**. The Board and the module resolve to the same query primitive, so **Month agreeing across both contexts is structural rather than maintained**. And the horizon is stored per context in a map the control can only index by the active context, so **the two horizons cannot leak into one another** even by mistake.

### E.3 Event / callback registry

| Event | Fired by | Consumed by | Payload | Purpose |
|---|---|---|---|---|
| `setActiveContext` | `ProgramElementSelector`, `ElementTile` (live) | `SessionStateProvider` | context id | enter a module or return to the Board |
| `setHorizon` | `TimeHorizonControl` | `SessionStateProvider` | horizon | writes only `horizonByContext[activeContext]` |
| `selectLine` | `CompositionBar` | module reducer | `'book' \| BusinessLine` | selects, opens Records, collapses the Comparison |
| `deselect` | close control; re-click of the selected bar | module reducer | none | one action: deselect, close, re-expand |
| `setRating` | `RatingFilter` | module reducer | rating or `'All'` | re-derives the table; resets page |
| `setPage` | `Pagination` | module reducer | page number | slices the same derived array |
| `openAbout` / `closeAbout` | `AboutAffordance`, `AboutModal` | `AboutAffordance` | none | the one overlay; focus returns to the trigger |

**There is no event that writes to the snapshot, and none that writes a derived value anywhere.**

---

## F. Gap Resolutions

*All twenty-two DD §8 flags, in document order, plus three items this document raises. Each states the decision, its rationale and what was rejected. Items carrying **amend-upstream** notes are gathered at the end.*

**F.1 — A1, the module declaration registry.** **Resolved:** §C.1 — one ordered array of `ModuleDeclaration`; bands are shell data carrying their own presentation; groups are module data; the shell holds no element inventory and is asserted by `check.ts` to contain no element id, title or group name. *Rejected: a keyed object (`Record<id, decl>`) — order would then be implicit and the fresh-row rule would need a separate ordering source; a registration function called at import time — registration order becomes load order, which is invisible and fragile.*

**F.2 — A2, the schema as data.** **Resolved:** §C.2 — `readonly RequirementRow[]`, the thirteen labels a `const` array, and a compile-time contract test that constructs three-row and fifteen-row renamed schemas. The build carries the schema unpopulated and unrendered; the only property demonstrable is that it is not a fixed type, which is the weaker claim the DD deliberately makes. *Rejected: a thirteen-field interface; a `Record` keyed by a label union — both make renaming a row a type change.*

**F.3 — A3, the data-access interface.** **Resolved:** §C.3 — one query primitive over scored records, synchronous, presentation-blind, injected at `main.tsx`. *Rejected: promise-returning queries (forces the forbidden loading state); aggregate methods on the interface (moves derivation out of the surfaces and creates a second place a number can be computed).*

**F.4 — A4, pre-paint scoring in the composition root.** **Resolved:** §D.3.4 and §D.5.1 — `buildSnapshot()` runs synchronously before `createRoot().render()`; the interface owns no lifecycle; a backend adds one `await` above `render` and changes nothing else. *Rejected: scoring lazily inside `query()`; a Suspense boundary.*

**F.5 — A5, the reference tables.** **Resolved:** §C.4 — both engine-internal, resolver-only, import-restricted, with provenance constants beside the data. Jurisdiction bands are **derived from score and country identity in code**, typed `'High' | 'Medium' | 'Low'` per CRRM v2.3 §4, and cross-checked against the source document's asserted column — **stored verbatim, no translation** — on all 177 rows at startup, plus the `Low`-is-the-United-States-alone assertion. A wrong band is therefore impossible unless the table disagrees with itself, in which case the build stops. *Rejected: `config/` placement (invites the generator to resolve bands and write them into records — check **DD-15**'s failure); a UI-consumable reference module (invites the record table to display a band the engine did not compute).*

**F.6 — A6, horizons derived or precomputed.** **Resolved:** derived by slicing one intake population at read time (§C.3). Precomputing three slices would create three stores that can disagree, which is the rule DD §8 exists to prevent. Independence is enforced by storage shape, not by discipline: the horizon is a map keyed by context and the control can only index the active one (§D.5.8). *Rejected: three precomputed arrays; a single horizon with a per-surface offset.*

**F.7 — A7, as-at versus trailing-window.** **Resolved:** §C.3 — one primitive taking `asOf` and `windowDays`. Board = moving `asOf`, fixed 30-day window. Module = fixed `asOf`, widening window. **This makes the Month agreement structural**, which closes by construction the seam that produced the wrong-number-set error a prior DD version shipped. *Rejected: two methods (`getAsAt`, `getTrailing`) — two code paths, and the Month agreement becomes a coincidence someone must maintain.*

**F.8 — A8, placement without positional knowledge.** **Resolved:** §D.5.16 — `placement: {band, group, order}`; the shell starts a fresh row when the declared group changes in render order, packing three per row, and names no group. Group order is order of first appearance. *Rejected: a group registry in the shell (the shell would then know the six groups, which is the tile inventory at one remove); a `row` field on the declaration (encodes layout in content, so re-ordering breaks the board).*

**F.9 — A9, one vocabulary, two presentations.** **Resolved:** §C.1 and §D.5.13 — presentation is a property of the band; a module declares only what it *has*; every slot exists in both presentations and `absent` renders nothing in either. *Rejected: a `presentation` field on the declaration (a module could declare one its band cannot draw, and the workbook column becomes a second source); presentation inferred from element size (there is one tile size and one row size — nothing to infer from).*

**F.10 — A10, cross-row field alignment.** **Resolved:** §D.5.16 — a fixed grid column template on every register row, with `--register-title-width` sized once from the longest title. Alignment is by construction; nothing measures anything; the shell inspects no content. **This requires one token that does not yet exist in `fcc-tokens.css`** — carried provisionally at 232 canvas and requested as a Touch Two addition at the phase 1 exit (§L.1). *Rejected: a runtime measurement pass (needs a layout pass before paint, which the pre-paint commitment forbids); CSS `subgrid` (aligns within a column, not across all 24 rows).*

**F.11 — A11, no-scroll enforced structurally.** **Resolved:** three layers — a fixed-height root with `overflow: hidden` (nothing can scroll or grow), `OverflowSentinel` (exact measurement, reports by element id, runnable **against the deployed board** via `?fit-check=1`, not development-only), and character budgets at transcription (early warning). **The flag's hypothetical was actual and is now closed at source:** against the 20 August workbooks, 19 of 24 register rows exceeded the measured line-2 budget, the worst by roughly 85%; the Coordinator's 21 August revision brought every row inside it, longest line 2 now 55 characters against 62 and longest title 27 against 28. The three layers remain as a **regression guard**, since the next content edit is the one nobody re-measures by hand. *Rejected: truncation with a `title` attribute (the feed caption is the partner story; truncating it reads as broken and removes the thing the rows exist to say); reducing caption size (the type floor is not spendable); a second caption line (the vertical budget's 34 canvas of reserve is already allocated to the scrim verification); a development-only sentinel (production clips silently, which is the failure the flag names — Designer note, 21 August 2026).*

**F.12 — A12, the mark's shape derived from its value.** **Resolved:** §D.5.19 — one prop, one exhaustive switch producing both form and hue, so a correctly-coloured wrongly-shaped mark cannot exist; plus a check asserting `HealthMark` is the only file referencing the status tokens. This is what makes the Coordinator's E2 ruling — defensibility on shape, not on the contrast number — survive construction. *Rejected: a `shape` prop beside a `value` prop (two sources for one meaning, and the illegal combination is expressible).*

**F.13 — A13, workbooks to declarations.** **Resolved:** §D.1.1 — generate-and-commit with hashes; the workbooks stay canonical; the generated file is never hand-edited; a content change is a workbook edit then a regeneration, in that order; regenerate-and-diff is a named condition at the phase 1 content gate and a step in `npm run check`. Enum values are matched **exactly including case**, so `Register Row` is carried as authored and no mapping step exists. *Rejected: build-time parsing on every deploy (a binary format, a parser and a build step in the deploy chain, for an occasional convenience); one-time transcription (every later edit becomes manual double-entry with no mechanical check).*

**F.14 — A14, the Governance and Reporting elements.** **Resolved:** declared **identically** to the other 21 register elements — same type, same slots, same scrim, same exclusion from the tab order. Their deferred click-through is not a structural property: an element is interactive iff its module is live, and none of these is. No exemption, no special case, nothing for the shell to know. *Rejected: a `deferred` flag (a field with no behaviour behind it, which is a field that will acquire one by accident).*

**F.15 — A15, frame and content composition.** **Resolved:** §D.5.5 — the frame sits outside the content area in the component tree as well as on screen, and never unmounts; the content area renders the active context's surface via `registry.find(...).surface`. The shell names no module. *Rejected: rendering the frame inside each surface (every module would then have to render chrome, and the frame's persistence would be a convention rather than a structure).*

**F.16 — A16, the context-scoped horizon.** **Resolved:** §D.5.4 and §D.5.8 — one widget, a value map keyed by context, and a control that can only address the active key. Both contexts initialise to Month; the module initialises to Month on first entry **regardless of the Board's value** and retains its own thereafter. *Rejected: a horizon prop threaded from the shell into the module (the shell would own the module's analytic state, which DD §4 uses as its test of whether a module is really a module).*

**F.17 — A17, the declared mark legend.** **Resolved:** §D.4.4 and §D.5.10 — contexts (Board and each module) carry a `ContextDeclaration` with `horizonLegend` and a `LegendEntry[]` discriminated union; the shell renders by `kind`. The Board is given a declaration although it is not a module, so the frame has one path instead of a branch. *Rejected: hardcoding the Board's two entries in `MarkLegend` (two of the board's most load-bearing strings inside the shell); a plain string legend (the module's rating ramp needs marks, not prose).*

**F.18 — A18, Comparison and Records as one surface with independent state.** **Resolved:** §D.6.3 — one reducer; changing the line changes `selectedLine` only, so the filter and horizon persist by construction rather than by remembering to preserve them; page resets whenever the result set's identity changes. *Rejected: separate `useState` per control (the exact arrangement in which a line change resets a filter that was meant to persist).*

**F.19 — A19, the accordion as one piece of state.** **Resolved:** §D.6.3 — `selectedLine` is the single source; panel visibility and Comparison height are **derivations of it**, so a panel cannot be open with nothing selected, and the bar cannot read selected with the panel closed. *Rejected: `{selectedLine, panelOpen, comparisonMode}` — three fields that can disagree, and the DD names the exact failure.*

**F.20 — A20, module state as one object.** **Resolved:** §D.5.4 and §D.6.3 — one module-owned object `{selectedLine, rating, page}` stored opaquely by the shell and keyed by module id, plus the horizon held separately because the shell's control must read and write it. *Rejected: storing the horizon inside the module state object (the shell's control could not reach it without inspecting the module's shape, which breaks the seam it is there to demonstrate).*

**F.21 — A21, pagination.** **Resolved:** §D.6.8 — page size and page state live in the module; the interface returns full result sets and knows nothing about pages. *Rejected: `query(q, {page, pageSize})` — a design change from 25 to 20 would become an interface change, which is a leaked concern by definition.*

**F.22 — A22, token consumption and enforcement.** **Resolved:** §D.5.22 and §L.3 — `fcc-tokens.css` is imported verbatim and never edited; components reference custom properties only; `check.ts` fails on any colour literal, any raw `px` outside the token file and the two CSS files that legitimately compose tokens, and on any occurrence of `--ink-secondary` under `src/shell/`. The scrim exists in exactly one component and one class, which is where the primary-ink rule is applied, so twenty-four call sites cannot each get it wrong. *Rejected: a lint rule alone (it would catch the literals and miss the ink rule, which is the one an Author would "correct" in good faith).*

### Items this document raises

**F.23 — Recharts is not installed. *(amend-upstream — closed 21 August 2026.)*** The frozen Form's Target medium field states *"Charts: Recharts."* Nothing in DD v0.9.4 is a chart. The Comparison is eight 100%-stacked composition bars — flex children with percentage widths, labels always present — and the sparklines that originally motivated a chart library were removed from the design before v0.9. Installing Recharts would add a substantial runtime dependency and its D3 transitive tree to a build whose **leading success criterion is measured at first paint**, in exchange for nothing the design asks for. **Decision: no chart library.** **Closed by Coordinator decision, 21 August 2026, and recorded as a fifth supersession of the frozen Form in DD v0.9.3's version history.** The Form itself is not amended, per the convention established when the Methodology was re-versioned against its v1.0 lock; downstream roles read that closure wherever the Form specifies a charting library.

**F.24 — The register's authored line-2 content overran its measured budget. *(Closed, 21 August 2026.)*** Raised on delivery of v0.1, resolved at source by the Coordinator's workbook revision rather than worked around downstream. See §F.11 for the measurement before and after. Retained as a numbered item rather than deleted, so a later reader meets the finding with its resolution attached.

**F.25 — `--register-title-width` is required and absent. *(token addition)*** §F.10. Carried provisionally at 232 canvas; requested as a Touch Two amendment at the phase 1 exit, alongside the scrim confirmation, so the Design System owner makes one visit rather than two.

> **Gap-loop completeness check.** Every ⚠️ flag in DD §8 (A1–A22) is closed above. None is deferred and none is marked non-blocking. Items carrying **amend-upstream** notes: **F.23** (Recharts, against the frozen Form). Items requiring a Touch Two amendment: **F.25** (`--register-title-width`), and the phase 1 confirmations already scheduled in §J.1. Items requiring Coordinator content work: **F.24** (register line-2 lengths), the two final mark-legend strings, and the five remaining Appendix A slots.

---

## G. Assembly & Routing

There are no routes. The application has one URL and four surfaces, and the active surface is a value in session state.

```
main.tsx
└── buildSnapshot()  → createFixtureDataAccess()          ← the injection point
    └── App
        ├── ErrorBoundary → FixtureErrorState
        ├── DataAccessProvider
        ├── SessionStateProvider          activeContext · horizonByContext · moduleState
        └── CanvasRoot                    1920×1080, overflow hidden, scaled
            ├── OverflowSentinel          (development only)
            └── Shell
                ├── NavigationFrame       persistent across every surface
                │   ├── ProgramElementSelector    27 entries, from the registry
                │   ├── TimeHorizonControl        one widget, context-scoped value
                │   ├── HorizonLegend             active context's declared string
                │   ├── MarkLegend                active context's declared entries
                │   └── AboutAffordance → AboutModal      (portal; the one overlay)
                └── content area          ← activeContext decides
                    ├── Board                      when 'board'
                    │   ├── BandLabel + TileBand         band 1, presentation 'tile'
                    │   └── BandLabel + RegisterField    band 2, presentation 'registerRow'
                    └── <module.surface />          otherwise
                        └── CustomerIntakeModule
                            ├── Comparison → CompositionBar × 8|4, MethodologyLabel
                            └── RecordsPanel → RatingFilter, RecordTable, Pagination
```

**The composition root is `main.tsx`, and it is the only place the data-access implementation is named.** Everything below it sees the interface. That is the sentence the seed contract's claim reduces to, and it is checkable by reading nine lines.

---

## H. Domain Configuration

### H.1 Design tokens
Consumed from `src/design/tokens.css` — `fcc-tokens.css` verbatim. **No component hardcodes a value the file defines and no value in it is adjusted during construction;** a change to a token is a Touch Two amendment routed through the Coordinator. Two rules are load-bearing and counter-intuitive: **scrimmed elements set metric header and caption in primary ink**, and **`font-display: block` with the metric-matched fallback at `size-adjust: 105.2%`**. Both are enforced structurally (§D.5.22, §H.3) rather than left to be remembered.

### H.2 Layout values
All from the token file: canvas 1920 × 1080 · frame 288 · field 1576 · register columns 3 × 509 at 24 · row 57 · within-group gap 8 · group separation 24 · band label block 48 · band separation 24 · tile band 140. **Vertical budget 982 against 1016, slack 34.** The slack is allocated to the phase 1 scrim verification, not spare. The three compression levers — band label block 48→40, tile band 140→128, group separation 24→20 — stand at nominal and **must not be spent before that check**.

> 🔧 **Implementation Note.** The token file's §10 comment reads *"980 used against 1016, slack 36"*; the arithmetic and the Design System spec §2 both give **982 / 34**. The governing rule covers values, not comments; carry 982 / 34. Noted for correction at the next Touch Two touch (Designer response, 20 August 2026).

### H.3 Type and font loading
Four steps, every value precomputed, per the token file's font-loading section: place `Inter.var.woff2` in `public/fonts/` · add the preload link in `index.html` **before any stylesheet**, with `crossorigin` (omitting it silently causes a double fetch) · the two `@font-face` blocks in order, `font-display: block` · the cold-load check at the phase 1 exit. **Recorded fallback:** if the cold-load check misbehaves and one round of fixing does not clear it, swap `--font-family` to the system stack and ship — the scale was set so this is a swap, not a redesign.

### H.4 Fixture tuning knobs — `config/fixture.config.ts`
One file, every knob, no knob anywhere else: `bookSize` · `bookSegmentShares` · `bookLineHighRates` · `historicMonthlyIntakeByLine` (**Retail and Asset Management held constant and never tuned to make an aggregate land**) · `commercialVolumeMultiplierByMonth` · `baasShareOfCommercialByMonth` · `baasForeignRate` · `alertTailSize` · `pepPrevalenceByType` · `deliberatelyUnlistedJurisdictions` · `randomSeed`.

**The twenty-two validation checks are DD §3's, carried verbatim as the phase 2 gate.** They are cited throughout this document as **DD-1 … DD-22**, to distinguish them from this document's own nineteen verification hooks, cited as **TAD-1 … TAD-19** (§L.3). *(Both lists happen to have a jurisdiction item at position 15, which is why the labels exist — TAD Reviewer Finding 4, 21 August 2026.)* Engine conformance DD-1–3; population targets DD-4–8a (evaluated jointly, DD-8's relative tolerance governing on conflict) and DD-9 (reported, never failed on); structural integrity DD-10–15; narrative legibility DD-16–22. **The knobs move, never the rule.** If the knobs cannot reach a target, that is a flag to the Coordinator, not a licence to adjust the engine or hand-set a derived field.

### H.5 Authored content
Board content arrives as generated declarations (§D.1.1). In-product strings live in `src/shell/copy.ts` and `src/modules/kyc-intake/copy.ts` — one file per owner, so an Appendix A slot has one home. The About text lives in `src/shell/about.ts` as approved copy under domain-review protection: **pasted, not edited, not reflowed.**

---

## I. Web-Platform Considerations

1. **Accessibility.** Keyboard operability of the core loop with the focus order fixed by DD §4: `Program Element → Time Horizon → About`, then on the Board `Customers tile`, and in the module `business lines left to right → rating filter → close → pagination when present`. Focus rings are `--focus-ring` at `--focus-ring-offset` on every interactive element. **The 24 inactive elements are not focusable, which is itself the honesty signal.** Record rows are not focusable and the table is not a scroll region. The About modal is the only focus trap. All motion respects `prefers-reduced-motion`, which the token file implements by zeroing the three duration tokens — so honouring it requires no component to check anything.
2. **Responsive posture.** None, by decision. One canvas, scaled uniformly (§C.5). No breakpoints, no fluid type ramp, nothing to maintain.
3. **Performance.** Two runtime dependencies; no chart library; one self-hosted variable font preloaded from the same origin. Scoring ~4,850 records runs synchronously before first paint — measured in milliseconds for arithmetic of this shape, and it is the reason no loading state exists. The fixture ships as JSON in the bundle. **No hard budget is set; the commitment is that the board paints complete on first paint**, which the cold-load check verifies directly.
4. **Determinism.** The generator is seeded; the fixture is generated once and committed; the snapshot is frozen; every displayed number is a pure function of it. **The demo cannot vary between rehearsal and the room.**
5. **Public deployment and no secrets.** Nothing sensitive ships. All data is synthetic, **no customer names at all** (a DD supersession of the Form's "fake names only"), no real institution depicted. The deployment is public by Coordinator decision; the protection is the synthetic-data lock, not obscurity. `public/robots.txt` carries a `noindex` directive so a board of plausible bank records does not accumulate search traffic — two lines, phase 1.

---

## J. Build & Deployment Sequence

*The TAD's phased sequence governs over the Inception Spec's indicative build order. Each phase ends deployed.*

### J.1 — Shell
Convert the scaffold to TypeScript · install the two runtime dependencies and the dev set · pin Node in all three places · import `fcc-tokens.css` · font: file, preload, `@font-face`, cold-load · `CanvasRoot` · `robots.txt` · commit `TAD.md` · commit the three workbooks · `generate-declarations` · the full board rendering 26 elements from declarations, with the live tile's resolvers stubbed to DD §3's figures · the frame with both legends and the Program Element selector · `npm run check` and the GitHub Action.

**Exit — all of the following, judged by looking:**
- The live URL renders the complete board at all three Board horizons.
- **The five verifications** (DD §1): the scrim at both presentations with captions clearing AA · the zero-value element reading as *nothing overdue* · the extreme case, fill winning over mark · the font cold-load with no reflow · the green mark reading as a mark rather than an absence.
- **The content condition:** the frame renders the confirmed mark-legend strings — ***Business Risk*** and ***Control Risk*** — and the 288-canvas frame width holds.
- **Regenerate-and-diff** is clean (`npm run check`).
- **Node parity:** the Vercel deploy log reads 24.x.
- **The fit check passes on the deployed board, not only locally:** open `https://fccprogramintegrator.vercel.app/?fit-check=1` in a window sized to 1440 wide, at each of the three Board horizons, and confirm the line reads *"fit check: 26 elements, no overruns"*. This is the only place the real font, the real strings and the real scale meet *(Designer note, 21 August 2026)*. Offenders, if any, are listed by element and routed to the Coordinator as content items.
- **Touch Two re-engagement:** the Design System owner receives the deployed URL, a whole-board screenshot at a 1440-wide viewport, the token file as built, and the five outcomes; returns confirmed or amended token values, including `--register-title-width`. Any change lands as a Touch Two amendment through the Coordinator, never as an edit at the terminal.

### J.2 — Engine, reference tables and fixture *(headless)*
Methodology constants · scorer · both reference tables with their startup assertions · the twelve worked examples · the generator and its config · the twenty-two validation checks.

**Exit — binary gate. Not "looks right":** all twelve worked examples reproduce exactly · band boundaries verified at 2.40 / 3.40 / 4.20 / 4.40 · the PEP override behaves as a floor and never a ceiling · every structural-integrity check passes with zero exceptions, including *no onboarded record above 4.20* and *no jurisdiction band present in source data* · population targets land within tolerance, or the knobs move and the gate re-runs · **no UI exists yet and none is required to judge this.**

### J.3 — The live tile wired
`snapshot` · `fixtureDataAccess` · the composition root · replace the stubbed resolvers with real as-at queries; delete the stub. **Exit:** the Customers tile's hero and trend derive live at all three Board horizons and reproduce §3's as-at set within tolerance; the board still paints complete on first paint.

### J.4 — The Comparison
The module mounts behind the data access · module state and its session storage · eight bars and four · the declared rating-ramp legend · the methodology label. **Exit:** entering the module opens full height on Month regardless of the Board's horizon; the Board's horizon is intact on return; Commercial's High segment is unmistakable without being pointed at. **Design System owner follow-touch:** the composition axis label is resolved here — labelled or deliberately unlabelled — against a real Comparison rather than in the abstract, and lands as a Touch Two amendment through the Coordinator (§L.1).

### J.5 — The Records *(the differentiator)*
The accordion · eleven columns · redaction · the rating filter · pagination · the four record states. **Exit:** the full drill-down chain runs; Commercial / High / Month returns one clean page with no pagination controls; switching lines swaps the table without re-expanding or resetting the filter; `prefers-reduced-motion` gives an instant reflow with the selected line still readable.

### J.6 — Polish and acceptance
The About modal with the approved text pasted verbatim · the focus-order pass end to end · the error state · a Design System conformance pass · the fresh-context acceptance review against the frozen Form's success criteria.

**Exit — the definition of done, with two go-live gates named:** **the About panel populated** and **the traceability moment present**; both drill-down levels working; the board rendering from declarations with inactive modules honestly marked; the zero-typing skim path working; `npm run check` green; the acceptance Reviewer, given the live URL, the success criteria and the demo narrative **and nothing else**, passes it.

**Redeploy at every exit.** The invariants: ship the shell first, prove the engine headless second, the differentiator before polish, acceptance last.

---

## K. Non-Negotiable Constraints (Recap)

### K.1 Seed contracts *(Playbook: elevated lock)*

**No artifact may alter these without a Coordinator-approved amendment to this document, even when the change seems locally sensible — which is exactly when it will look most reasonable.**

| # | Seed contract | Defined at | Survives into |
|---|---|---|---|
| 1 | The module declaration registry | §C.1 | the platform's module system |
| 2 | The module declaration schema | §C.2 | the platform's module template |
| 3 | The data-access interface | §C.3 | the platform's data layer |
| 4 | The scoring engine | §D.2 | the platform's customer-risk engine |
| 5 | The design tokens | `fcc-tokens.css` | the platform's design system |

> 🔧 **Note on the count.** The Designer's handoff names three — A1, A2, A3. The frozen Form's Seed intent names five, and DD §8 lists the same five as candidates for this document to designate. All five are designated. The first three are structural interfaces whose lock is about *shape*; the last two are canonical-content-bound artifacts whose lock is about *fidelity* — the engine to the Methodology, the tokens to Touch Two. The lock is the same in both cases: amendment through the Coordinator, never a local edit.

### K.2 Hard locks

1. **The board does not scroll.** Fixed-height root, `overflow: hidden`, no scroll container anywhere in the application. *(Enforced structurally by §C.5; monitored by `OverflowSentinel`.)*
2. **No component reads the fixture.** *(Enforced by import restriction and `check.ts`.)*
3. **The shell contains no element-specific code.** No element id, title or group name appears under `src/shell/`. *(Enforced by `check.ts`.)*
4. **The declaration schema is data, not a type.** *(Enforced by the compile-time contract test, §C.2.)*
5. **No component hardcodes a token value.** *(Enforced by `check.ts`.)*
6. **Scrimmed elements set metric header and caption in primary ink.** *(Enforced by one class in one component, plus a check that `--ink-secondary` is absent under `src/shell/`.)*
7. **The engine imports nothing from the UI and is provable headless.** *(Enforced by import restriction; proven by the phase 2 gate.)*
8. **No derived field is ever hand-set;** every rating, score, band and route is engine output. *(Enforced by the generator's source-only input type and checks **DD-13** and **DD-15**.)*
9. **No onboarded record scores above 4.20.** Zero exceptions. *(Check **DD-10**.)*
10. **The Unacceptable band stays in the engine and never appears on screen.** The displayed scale is three-level.
11. **The knobs move, never the rule.** A missed population target is a tuning problem or a Coordinator flag, never an engine change.
12. **The mark-legend strings are fixed at *Business Risk* and *Control Risk*, and the frame never widens or narrows.** 288 canvas, as derived at Touch Two. *(DD v0.9.4 Appendix A.4.)*
13. **The three compression levers stay at nominal until the phase 1 scrim check.**
14. **The About text is pasted verbatim and never reflowed to fit.** If it does not fit, the modal changes.
15. **Inactive elements are non-interactive, unhovered and out of the tab order** — in every state, at every horizon.
16. **`fcc-tokens.css` is never edited in the repository.** A token change is a Touch Two amendment through the Coordinator.
17. **Go-live gates:** the About panel populated; the traceability moment present.

---

## L. Appendices

### L.1 Open items *(not architecture decisions)*

| Item | Where | Status |
|---|---|---|
| `--register-title-width` | §F.25 | Provisional 232 canvas; Touch Two addition requested at the phase 1 exit |
| `--scrim-opacity` and its neighbours | token file | Provisional 0.32; confirmed at the phase 1 exit |
| Register line-2 content lengths | §F.11, §F.24 | **Closed 21 Aug 2026** — all 26 elements inside budget on all three horizons |
| `QA` double space · EWRA `Notes` cell | §D.1.1 | Cosmetic; whitespace collapsed at transcription and reported; `Notes` not imported |
| DD §5's live-tile metric header string | §L.4.7 | **Closed 21 Aug 2026** — DD v0.9.3 corrected §5 to the workbook's wording, *% New Customers High Risk* |
| The two Board mark-legend strings | DD v0.9.4 Appendix A.4 | **Closed 21 Aug 2026** — *Business Risk* · *Control Risk*; short form superseded, no width contingency |
| *Route* values · record-count header · empty-for-filter line | DD Appendix A.5 | Open; required at phase 5 |
| Composition axis label | DD Appendix A.5 | **Design System owner, follow-touch, resolved no later than the phase 4 exit.** A design item — *whether* the 0–100% axis is labelled at all — not a copy slot. DD Appendix A.5 names the Designer *with Touch Two*; both routes closed at handoff, so the Coordinator re-routed it on 21 August 2026 |
| Inactive dropdown text | DD Appendix A.6 | Open; any time before go-live |
| Basel access date in the About text | About copy | Captured: 20 August 2026 |
| Token file's 980/36 comment | §H.2 | Carry 982/34; next Touch Two touch |
| Recharts in the frozen Form | §F.23 | **Closed 21 Aug 2026** — fifth supersession recorded in DD v0.9.3 |
| Tile character budgets (60 / 60) | §D.1.1 | Provisional; confirmed by `OverflowSentinel` at the phase 1 exit |
| **TAD-to-DD fidelity** | — | **Checked and clean, 21 Aug 2026.** A fresh-context Reviewer with DD v0.9.2 and the Marketing Pack assessed v0.3 against the twenty-two flag resolutions, the interaction matrix, the two number sets, the check labelling and the seed-contract designations, and returned no findings. Not re-run against v0.9.4, whose changes are confined to the legend strings and are carried here |

### L.2 Component count summary

| Area | Units | Items |
|---|---|---|
| Build-time scripts | 3 | D.1.1–D.1.3 |
| Engine | 5 | D.2.1–D.2.5 |
| Data layer | 4 | D.3.1–D.3.4 |
| Declarations | 5 | D.4.1–D.4.5 |
| Shell | 24 | D.5.1–D.5.24 |
| Module | 11 | D.6.1–D.6.11 |
| Shared | 2 | D.7.1–D.7.2 |
| **Total** | **54** | of which 45 are named build units and 9 are type/data/CSS modules |

### L.3 Verification hooks — `npm run check`

Every mechanically checkable claim, in one script, each printing a pass/fail line. **These are cited elsewhere in this document as TAD-1 … TAD-19**, never as bare numbers, to keep them distinct from DD §3's twenty-two fixture checks (**DD-1 … DD-22**, §H.4).

**Structure (grep-shaped).**
1. No file outside `src/data/` imports `src/generated/fixture.generated.json`.
2. No file under `src/shell/` or `src/modules/` imports anything from `src/engine/reference/`.
3. No file under `src/engine/` imports React or anything from `src/shell/`, `src/modules/` or `src/design/`.
4. No file under `src/shell/` contains any element id, element title or group name from the registry.
5. No colour literal (`#`, `rgb(`, `hsl(`) outside `src/design/tokens.css`.
6. No raw `px` value outside `tokens.css`, `canvas.css` and `elements.css`.
7. `--ink-secondary` appears in no file under `src/shell/`.
8. `--status-red|amber|green` appears only in `HealthMark.tsx` and `tokens.css`.
9. `src/generated/` files carry the *generated — do not edit* header and are byte-identical to a fresh generation.

**Contract (compile-shaped).**
10. `schema.contract.test.ts` compiles — three-row and fifteen-row renamed schemas both satisfy `DeclarationSchema`.
11. `tsc --noEmit` passes under `strict`.

**Engine (test-shaped).**
12. All twelve worked examples reproduce exactly.
13. Band boundaries hold at 2.40 / 3.40 / 4.20 / 4.40.
14. The PEP override is a floor and never a ceiling.
15. The jurisdiction table's derived bands match its asserted column on all 177 rows, and exactly one row is `Low` and it is the United States.

**Content.**
16. Regenerate-and-diff against the committed workbook hashes.
17. Declaration data satisfies all nine gate conditions of §D.1.1.
18. Character budgets reported per element, over-budget rows listed by name.

**Fixture (phase 2 onward).**
19. The twenty-two **DD-checks** of DD §3, reported individually; the binary ones fail the run, **DD-9** reports only.

### L.4 Precomputed values and exact algorithms

*Everything below is specified rather than left to judgement, per DD §1's capability constraint. If an Author has to decide one of these, that is a defect in this document.*

#### L.4.1 Dates, and the frozen `asOf`

`IsoDate` is a `YYYY-MM-DD` string. No time component, no timezone, no date library. Comparison is lexical, which is exact for this format.

**`asOf` is a constant written into the fixture at generation and read from `snapshot.meta.asOf`. It is never `new Date()`.** A clock-derived "today" would make the board change as days pass, break determinism, and eventually put a different number on screen in the room than in rehearsal — the one thing DD §3 forbids absolutely.

Day arithmetic uses one four-line helper:

```ts
const addDays = (d: IsoDate, n: number): IsoDate => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};
```

**Window membership is `addDays(asOf, -windowDays) < onboardedAt <= asOf`** — lower bound exclusive, upper inclusive. Stated because the two conventions differ by one record at every boundary and check **DD-11**'s nesting depends on one of them being used everywhere.

#### L.4.2 Horizon mappings

| Horizon | Board (as-at) | Module (trailing window) |
|---|---|---|
| `month` | `asOf` offset **0** days, window **30** | `asOf`, window **30** |
| `quarter` | offset **90**, window **30** | `asOf`, window **90** |
| `year` | offset **365**, window **30** | `asOf`, window **365** |

The Board's window is **always 30 days** and only its `asOf` moves; the module's `asOf` is **always the snapshot's** and only its window moves. Month resolves to an identical query in both, which is why the two contexts agree at 11.0% structurally (§F.7).

#### L.4.3 Element ids

Derived once at transcription, written into the generated JSON, and never re-derived at runtime:

```ts
const toId = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
```

Worked: `Exam / Audit Mgmt.` → `exam-audit-mgmt` · `Models & Non-model Tools` → `models-non-model-tools` · `FCC Risk Appetite Statement` → `fcc-risk-appetite-statement` · `Customers` → `customers`. Uniqueness across the 26 is a gate condition (§D.1.1). Writing the id into the JSON is what stops a later title edit from silently repointing a declaration.

#### L.4.4 Sort orders

- **Program Element dropdown:** the Board first, then the 26 elements by `title.localeCompare(other, 'en')`. Not by id, not by registry order.
- **Board rendering:** registry order, which is workbook row order. Never sorted.
- **Record table:** the order the data access returns, which is fixture order, which is generation order. **No sort control ships**, so no comparator is needed and none should be invented.

#### L.4.5 Register packing, with its arithmetic

Walk declarations in registry order; start a fresh row when `placement.group` changes; pack up to three per row. That produces, from the six groups' element counts:

| Group | Elements | Rows |
|---|---|---|
| Risk Assessments | 2 | 1 |
| Core pillars | 5 | 2 |
| FCC Programs | 2 | 1 |
| Program infrastructure | 8 | 3 |
| Data, models and records | 4 | 2 |
| Governance and Reporting | 3 | 1 |
| **Total** | **24** | **10** |

Which reconciles with the Design System spec §2 budget exactly: 10 rows × 57 = **570** · four within-group gaps × 8 = **32** (a group of *r* rows contributes *r−1*) · five group separations × 24 = **120** · two band labels × 48 = **96** · one band separation × 24 = **24** · tile band **140** · total **982** against 1016. **If an Author's packing does not produce ten rows, something is wrong before any pixel is inspected.**

#### L.4.6 Number formatting — `lib/format.ts`

The `Unit / format` column selects a formatter. **Only `%` contributes a visible glyph;** the others are format selectors, because the metric header already carries the word.

| Unit | Rule | Examples |
|---|---|---|
| `%` | exactly one decimal, `%` appended | `0.8` → `0.8%` · `12` → `12.0%` · `11.0` → `11.0%` |
| `count` | integer, thousands separator, no symbol | `18` → `18` · `1728` → `1,728` |
| `Days` | integer, no symbol | `42` → `42` |
| `n/a` | the slot is `absent` and never reaches a formatter | — |

Elsewhere: **scores always two decimals** (`3.6` → `3.60`, so the record table's column reads as a scale rather than as arithmetic) · **composition segment labels are whole percent** (eight bars × three segments of one-decimal figures is noise, and no share on that surface turns on a tenth) · record counts use the `count` rule. *The composition-label precision is a decision within remit; a Coordinator copy decision overrides it.*

#### L.4.7 The remaining type definitions

Referenced in §D.4.1 and completed here so no one has to infer them:

```ts
export type Unit        = '%' | 'count' | 'Days';
export type TrendValue  = 'Increasing' | 'Stable' | 'Decreasing';
export type BandId      = 'business-risk' | 'program-elements';
export type IsoDate     = string;                    // 'YYYY-MM-DD'
export interface HeroValue  { readonly value: number; readonly unit: Unit }
export interface ComputeContext { readonly horizon: Horizon; readonly data: CustomerDataAccess }
export interface RegulatoryAlignment { readonly document: string; readonly citation: string }
export interface SnapshotMeta {
  readonly asOf: IsoDate;
  readonly generatedAt: IsoDate;
  readonly randomSeed: number;
  readonly jurisdictionSource: { source: string; edition: string; accessed: IsoDate; threshold: string };
}
```

**A note on two strings an Author will meet twice.** The live tile's metric header renders `% New Customers High Risk`, as authored in the workbook. *(DD §5 previously read *New Customers % High Risk*; corrected to the workbook's wording in v0.9.3, since under DD Appendix A.3 the workbook is the transcription source and governs.)* And the second mark-legend entry renders the label **Control Risk** while the DD continues to describe the encoding as *control effectiveness risk* — a deliberate distinction recorded at DD v0.9.4 §5, not a discrepancy. **In both cases the rendered string is the one specified here; the descriptive phrasing elsewhere is the DD describing an encoding, not naming a label.**

#### L.4.8 Focus order, implemented

**DOM order only. No positive `tabIndex` anywhere in the build**, so the stated order in §I.1 is produced by the order elements are rendered in and cannot drift from it. Inactive elements render as non-interactive elements — a `div`, not a disabled `button` — with no `tabIndex`, no `role`, no handlers and no hover rule, which is what makes their exclusion from the tab order structural rather than a suppression. The one exception to DOM order is the About modal's focus trap, which is explicit (§D.5.12).

#### L.4.9 `useModuleSession`, exactly

```ts
function useModuleSession<T>(moduleId: string, initial: T): readonly [T, (next: T) => void];
```

It returns the stored value for `moduleId`, or `initial` if none is stored, and a setter that replaces it. **It is not a reducer** — the module supplies its own:

```ts
const [state, setState] = useModuleSession('kyc-intake', initialKycState);
const dispatch = (action: KycAction) => setState(kycReducer(state, action));
```

That split is what keeps the shell generic: the shell provides storage typed `unknown` and the module provides the shape and the transitions, so a module can change its entire state model without the shell recompiling.

---

*v1.1 — 21 August 2026. Drafted from Design Document v0.9.4, the frozen Project Inception Form v1.2, Customer Risk Rating Methodology v2.3, the Design Direction brief v1.0, the Design System spec v1.0 with `fcc-tokens.css`, the Jurisdiction Risk Ratings of 20 August 2026, and the three Appendix B workbooks of 21 August 2026. Five Coordinator decisions of 20–21 August 2026 are incorporated: generate-and-commit for declaration data; full-table Basel ingestion with band derived in code; the unlisted-jurisdiction rule; the retirement of the viability checkpoint; and Design System owner re-engagement at the phase 1 exit. Twenty-two DD flags closed in §F; the one amend-upstream item raised (F.23, Recharts) closed upstream at DD v0.9.3. **v0.2 incorporated the Coordinator's 21 August workbook revision — which closed F.24 at source — the Designer's note that the overflow sentinel must run against the deployed board rather than local development only, and a new §L.4 specifying every value and algorithm an Author would otherwise have to decide. v0.3 closes all five findings of the 21 August TAD Reviewer pass: the jurisdiction band vocabulary, corrected at source in CRRM v2.3 and now a direct comparison with no translation step (F1); character budgets split by presentation (F2); an owner and a phase for the composition axis label (F3); the DD-n / TAD-n check labels (F4); and the withdrawal of an incorrect claim about the `QA` cell (F5). TAD-to-DD fidelity remains independently unverified and is recorded as such in §L.1.** **Approved by the Coordinator, 21 August 2026, and released for construction.***

---

### Version history

| Version | Date | Change |
|---|---|---|
| 0.1 | 21 Aug 2026 | First full draft from DD v0.9.2. Twenty-two flags closed in §F; three items raised — Recharts as amend-upstream, the register line-2 overrun, and the missing `--register-title-width` token. |
| 0.2 | 21 Aug 2026 | Coordinator's revised Appendix B workbooks incorporated, closing the line-2 overrun at source. Designer's note accepted: `OverflowSentinel` runs against the deployed board, not development only. §L.4 added — every value and algorithm an Author would otherwise have to decide. |
| 0.3 | 21 Aug 2026 | All five findings of the Author-readiness Reviewer pass closed. Jurisdiction band vocabulary now a direct comparison with no translation step, following the Coordinator's correction at source in CRRM v2.3; character budgets split by presentation; the composition axis label given an owner and a phase; `DD-n` / `TAD-n` check labels; an incorrect claim about the `QA` cell withdrawn and recorded. |
| **1.0** | **21 Aug 2026** | **Approved and released for construction.** TAD-to-DD fidelity pass returned clean with no findings. No content change from v0.3 beyond this approval. |
| **1.1** | **21 Aug 2026** | Upstream closures carried, no architectural change. **The two Board mark-legend strings are final** — *Business Risk* and *Control Risk*, DD v0.9.4 Appendix A.4 — the short-form authorisation superseded and the width contingency removed, so nothing about the frame is decided at the phase 1 exit; §K.2.12 rewritten accordingly. **F.23 closed** as a fifth supersession of the frozen Form at DD v0.9.3. DD §5's live-tile metric header corrected upstream. Citations moved from DD v0.9.2 to v0.9.4. **All content items blocking phase 1 are now closed.** |
