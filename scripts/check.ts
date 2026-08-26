// TAD §L.3, §B.3 — "one npm script a human can run and read." This file is
// built early (phase 1) and grows as later phases add checks that have
// something to verify. Currently implemented: the checks that have
// something to check in phase 1 (grep-shaped token/import rules, the
// generated-declarations invariants, and the compile-time schema contract
// via typecheck). Engine and fixture checks (worked examples, band
// boundaries, population tolerances) are added in phase 2 once the engine
// exists — they are listed below as TODO so the script's shape doesn't
// silently drift from §L.3's full list of nineteen.
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

interface CheckResult {
  id: string;
  description: string;
  pass: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function record(id: string, description: string, pass: boolean, detail?: string): void {
  results.push(detail !== undefined ? { id, description, pass, detail } : { id, description, pass });
}

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git' || entry === 'generated') continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...walk(full, exts));
    else if (exts.includes(extname(full))) out.push(full);
  }
  return out;
}

// --- TAD-4/5/6 (§L.3) — grep-shaped token discipline checks ---------------

function checkNoRawColorLiterals(): void {
  const files = walk(join(ROOT, 'src'), ['.tsx', '.ts', '.css']).filter(
    (f) => f !== join(ROOT, 'src/design/tokens.css'),
  );
  const hexPattern = /#[0-9A-Fa-f]{3,8}\b/g;
  const offenders: string[] = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    const matches = content.match(hexPattern);
    if (matches) offenders.push(`${f.replace(ROOT + '/', '')}: ${matches.join(', ')}`);
  }
  record(
    'TAD-4',
    'No raw hex color literals outside src/design/tokens.css',
    offenders.length === 0,
    offenders.join('; '),
  );
}

function checkNoRawPxOutsideTokens(): void {
  // Allowed: tokens.css itself (the source of every spacing/sizing px
  // value); hairline borders and small corner radii, which are
  // conventionally exempt from a spacing-token scale in most design
  // systems and are not part of fcc-tokens.css's own scale; and the one
  // explicitly-flagged PROVISIONAL value pending Touch Two confirmation.
  // What this check actually guards against: a spacing/sizing value
  // (width, height, gap, margin, padding, font-size) hand-typed instead of
  // referencing var(--space-*), var(--type-*), etc.
  const files = walk(join(ROOT, 'src'), ['.css']).filter((f) => f !== join(ROOT, 'src/design/tokens.css'));
  const exemptPatterns = [/^border(-\w+)?:\s*\d/, /^border-radius:/, /PROVISIONAL/, /BUDGET/];
  const pxPattern = /(?<!var\([^)]*)\b\d+(\.\d+)?px\b/g;
  const offenders: string[] = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    const originalLines = content.split('\n');
    // Strip block comments across the WHOLE file first (dotAll-equivalent
    // via [\s\S]) — a comment spanning multiple lines has no per-line
    // /* or */ marker on its middle lines, so a line-by-line strip can't
    // see it's still inside a comment and wrongly treats prose like
    // "...232px canvas..." as a style declaration. Exemption markers
    // (PROVISIONAL/BUDGET) are still checked against the ORIGINAL line,
    // since those always live in a same-line trailing comment.
    const codeOnlyLines = content
      .replace(/\/\*[\s\S]*?\*\//g, (match) => '\n'.repeat((match.match(/\n/g) ?? []).length))
      .split('\n');
    for (let i = 0; i < codeOnlyLines.length; i++) {
      const codeLine = (codeOnlyLines[i] ?? '').trim();
      const originalLine = (originalLines[i] ?? '').trim();
      if (exemptPatterns.some((p) => p.test(originalLine))) continue;
      const matches = codeLine.match(pxPattern);
      if (matches) offenders.push(`${f.replace(ROOT + '/', '')}: "${originalLine}"`);
    }
  }
  record('TAD-5', 'No raw px spacing/sizing values outside src/design/tokens.css', offenders.length === 0, offenders.join('; '));
}

function checkNoInkSecondaryUnderScrim(): void {
  // Rewritten 23 Aug 2026 after the scrim/fill correction (Design System
  // Spec §8.1, verified directly): scrim belongs to INACTIVE elements —
  // both tiles and register rows — not the live tile, which was this
  // build's original (backwards) assumption. Metric header and caption
  // now use ink-primary unconditionally in ElementTile.tsx (no live/
  // inactive branch), and RegisterRow's source/metric spans rely on
  // inheriting ink-primary from the .scrim class on their ancestor —
  // which only works if those CSS rules don't hardcode a color of their
  // own. This check verifies both halves of that invariant directly,
  // rather than pattern-matching a specific variable name that no longer
  // exists.
  const offenders: string[] = [];

  const tileFile = join(ROOT, 'src', 'shell', 'ElementTile.tsx');
  const tileContent = readFileSync(tileFile, 'utf-8');
  if (/metricHeader[\s\S]{0,300}?ink-secondary/.test(tileContent) || /feedCaption[\s\S]{0,300}?ink-secondary/.test(tileContent)) {
    offenders.push(`${tileFile.replace(ROOT + '/', '')}: metric header or caption hardcodes ink-secondary`);
  }

  const cssFile = join(ROOT, 'src', 'design', 'elements.css');
  const cssContent = readFileSync(cssFile, 'utf-8');
  for (const selector of ['.register-row__source', '.register-row__metric > span']) {
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = cssContent.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
    if (match && /color:\s*var\(--ink-secondary\)/.test(match[1] ?? '')) {
      offenders.push(`${cssFile.replace(ROOT + '/', '')}: ${selector} hardcodes ink-secondary, which would override the inherited primary from .scrim`);
    }
  }

  record(
    'TAD-6',
    'Scrimmed (inactive) elements use primary ink for metric header / caption, never secondary',
    offenders.length === 0,
    offenders.join('; '),
  );
}

// --- TAD-2/3 (§L.3) — the engine is provable headless, and nothing under
// shell/modules reaches into the engine's internal reference tables -------

function checkNoShellImportOfEngineReference(): void {
  const files = walk(join(ROOT, 'src', 'shell'), ['.ts', '.tsx']).concat(
    walk(join(ROOT, 'src', 'modules'), ['.ts', '.tsx']),
  );
  const offenders: string[] = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    const importLines = content.match(/^import[^\n;]*from\s+['"][^'"]*['"];?/gm) ?? [];
    for (const line of importLines) {
      if (/engine\/reference/.test(line)) offenders.push(`${f.replace(ROOT + '/', '')}: ${line.trim()}`);
    }
  }
  record(
    'TAD-2',
    'No file under src/shell/ or src/modules/ imports anything from src/engine/reference/',
    offenders.length === 0,
    offenders.join('; '),
  );
}

function checkEngineIsHeadless(): void {
  const files = walk(join(ROOT, 'src', 'engine'), ['.ts', '.tsx']);
  const offenders: string[] = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    const importLines = content.match(/^import[^\n;]*from\s+['"][^'"]*['"];?/gm) ?? [];
    for (const line of importLines) {
      const specifierMatch = line.match(/from\s+['"]([^'"]*)['"]/);
      const specifier = specifierMatch?.[1] ?? '';
      const isReact = specifier === 'react' || specifier.startsWith('react/') || specifier.startsWith('react-dom');
      const reachesUi = /\/(shell|modules|design)\//.test(specifier) || /^\.\.\/(shell|modules|design)\//.test(specifier);
      if (isReact || reachesUi) offenders.push(`${f.replace(ROOT + '/', '')}: ${line.trim()}`);
    }
  }
  record(
    'TAD-3',
    'No file under src/engine/ imports React or anything from src/shell/, src/modules/ or src/design/',
    offenders.length === 0,
    offenders.join('; '),
  );
}

// --- Mark/glyph shape-color coupling (Architect's note, 23 Aug 2026) ------

function checkHealthMarkIsOnlyStatusColorReference(): void {
  // Shape and hue must derive from the same value through one exhaustive
  // switch in HealthMark, never duplicated elsewhere — a second reference
  // is how a mark could exist with the right colour and the wrong form.
  const files = walk(join(ROOT, 'src'), ['.ts', '.tsx']).filter(
    (f) => f !== join(ROOT, 'src/design/tokens.css'),
  );
  const pattern = /--status-(red|amber|green)/;
  const offenders: string[] = [];
  for (const f of files) {
    if (f === join(ROOT, 'src/shell/HealthMark.tsx')) continue;
    // Strip comments before matching — a comment explaining why a file
    // deliberately avoids these tokens (e.g. OverflowSentinel) is not a
    // usage of them.
    const codeOnly = readFileSync(f, 'utf-8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    if (pattern.test(codeOnly)) {
      offenders.push(f.replace(ROOT + '/', ''));
    }
  }
  record(
    'TAD-20',
    'HealthMark is the only file referencing --status-red|amber|green',
    offenders.length === 0,
    offenders.join('; '),
  );
}

// --- TAD-9 (§L.3) — generated files carry the header and are byte-stable --

function checkGeneratedFileHeader(): void {
  const path = join(ROOT, 'src', 'generated', 'declarations.generated.json');
  let ok = false;
  let detail = 'file not found — run npm run generate:declarations';
  try {
    const content = readFileSync(path, 'utf-8');
    ok = content.includes('GENERATED — DO NOT EDIT');
    detail = ok ? '' : 'header string missing';
  } catch {
    /* detail already set */
  }
  record('TAD-9', 'src/generated/declarations.generated.json carries the generated header', ok, detail);
}

// --- TAD-11 — the compile-time schema contract test, via tsc + vitest -----

function checkTypecheck(): void {
  try {
    execSync('npx tsc --noEmit', { cwd: ROOT, stdio: 'pipe' });
    record('TAD-11a', 'npx tsc --noEmit (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)', true);
  } catch (e) {
    const out = e instanceof Error && 'stdout' in e ? String((e as { stdout: Buffer }).stdout) : String(e);
    record('TAD-11a', 'npx tsc --noEmit', false, out.slice(0, 2000));
  }
}

function checkLint(): void {
  try {
    execSync('npx eslint .', { cwd: ROOT, stdio: 'pipe' });
    record('TAD-11b', 'npx eslint .', true);
  } catch (e) {
    const out = e instanceof Error && 'stdout' in e ? String((e as { stdout: Buffer }).stdout) : String(e);
    record('TAD-11b', 'npx eslint .', false, out.slice(0, 2000));
  }
}

function checkVitest(): void {
  try {
    execSync('npx vitest run', { cwd: ROOT, stdio: 'pipe' });
    record('TAD-11c', 'npx vitest run (schema seed-contract test)', true);
  } catch (e) {
    const out = e instanceof Error && 'stdout' in e ? String((e as { stdout: Buffer }).stdout) : String(e);
    record('TAD-11c', 'npx vitest run', false, out.slice(0, 2000));
  }
}

// --- Declaration data gate conditions (§D.1.1 gates, re-checked at build) -

function checkDeclarationGateConditions(): void {
  const path = join(ROOT, 'src', 'generated', 'declarations.generated.json');
  try {
    const doc = JSON.parse(readFileSync(path, 'utf-8')) as { declarations: unknown[] };
    const count = doc.declarations.length;
    record('TAD-17', 'Generated declarations: exactly 26 elements', count === 26, `found ${count}`);
    const live = (doc.declarations as { status: string }[]).filter((d) => d.status === 'live');
    record('TAD-17b', 'Generated declarations: exactly 1 live element', live.length === 1, `found ${live.length}`);
  } catch (e) {
    record('TAD-17', 'Generated declarations: exactly 26 elements', false, String(e));
  }
}

// --- TAD-12..15 (§L.3) — engine, test-shaped. §D.2.5: "eleven of twelve is
// a failure" — checkWorkedExamples fails the whole run on any mismatch. --

async function checkWorkedExamples(): Promise<void> {
  try {
    const { score } = (await import('../src/engine/score.ts')) as typeof import('../src/engine/score.ts');
    const { WORKED_EXAMPLES } = (await import('../src/engine/workedExamples.ts')) as typeof import('../src/engine/workedExamples.ts');
    const failures: string[] = [];
    for (const ex of WORKED_EXAMPLES) {
      const result = score(ex.customer);
      const points = [result.points.entityType, result.points.industry, result.points.product, result.points.jurisdiction, result.points.tmAlerts];
      const pointsOk = JSON.stringify(points) === JSON.stringify(ex.expectedPoints);
      const scoreOk = result.score === ex.expectedScore;
      const ratingOk = result.rating === ex.expectedRating;
      const floorRaised = result.route === 'PEP escalation';
      const overrideOk = (ex.expectedOverride !== null) === floorRaised;
      if (!pointsOk || !scoreOk || !ratingOk || !overrideOk) {
        failures.push(
          `#${ex.id}: points=${JSON.stringify(points)} (want ${JSON.stringify(ex.expectedPoints)}) ` +
            `score=${result.score} (want ${ex.expectedScore}) rating=${result.rating} (want ${ex.expectedRating}) route=${result.route}`,
        );
      }
    }
    record(
      'TAD-12',
      `All twelve worked examples reproduce exactly (CRRM v2.3 §7)`,
      failures.length === 0,
      failures.length === 0 ? '' : `${failures.length}/${WORKED_EXAMPLES.length} failed — ${failures.join(' | ')}`,
    );
  } catch (e) {
    record('TAD-12', 'All twelve worked examples reproduce exactly (CRRM v2.3 §7)', false, String(e));
  }
}

async function checkBandBoundaries(): Promise<void> {
  try {
    const { ratingFromScore } = (await import('../src/engine/methodology.ts')) as typeof import('../src/engine/methodology.ts');
    const cases: [number, string][] = [
      [2.40, 'Low'],
      [2.41, 'Medium'],
      [3.40, 'Medium'],
      [3.41, 'High'],
      [4.20, 'High'],
      [4.21, 'Unacceptable'],
      [4.40, 'Unacceptable'],
    ];
    const offenders = cases
      .map(([s, want]) => [s, want, ratingFromScore(s)] as const)
      .filter(([, want, got]) => got !== want)
      .map(([s, want, got]) => `score ${s}: got ${got}, want ${want}`);
    record(
      'TAD-13',
      'Band boundaries hold at 2.40 / 3.40 / 4.20 / 4.40 (CRRM v2.3 §5, strict inequalities)',
      offenders.length === 0,
      offenders.join('; '),
    );
  } catch (e) {
    record('TAD-13', 'Band boundaries hold at 2.40 / 3.40 / 4.20 / 4.40', false, String(e));
  }
}

async function checkPepFloorNeverCeiling(): Promise<void> {
  try {
    const { applyPepFloor } = (await import('../src/engine/methodology.ts')) as typeof import('../src/engine/methodology.ts');
    const offenders: string[] = [];
    // Floor raises a lower scored rating.
    const raised = applyPepFloor('Low', 'Domestic PEP');
    if (raised.rating !== 'Medium' || raised.route !== 'PEP escalation') offenders.push(`Low + Domestic PEP -> ${JSON.stringify(raised)}, want Medium/PEP escalation`);
    // Floor is silent when the scored rating already clears it.
    const silent = applyPepFloor('High', 'Domestic PEP');
    if (silent.rating !== 'High' || silent.route !== 'on score') offenders.push(`High + Domestic PEP -> ${JSON.stringify(silent)}, want High/on score`);
    // The floor must NEVER cap a higher rating down — the critical
    // "never a ceiling" property: Unacceptable stays Unacceptable even
    // against a Senior Foreign PEP's High floor.
    const neverCeiling = applyPepFloor('Unacceptable', 'Senior Foreign PEP');
    if (neverCeiling.rating !== 'Unacceptable' || neverCeiling.route !== 'on score') {
      offenders.push(`Unacceptable + Senior Foreign PEP -> ${JSON.stringify(neverCeiling)}, want Unacceptable/on score (the floor must never cap a rating down)`);
    }
    const none = applyPepFloor('Low', 'None');
    if (none.rating !== 'Low' || none.route !== 'on score') offenders.push(`Low + None -> ${JSON.stringify(none)}, want Low/on score`);
    record('TAD-14', 'The PEP override is a floor and never a ceiling (CRRM v2.3 §6)', offenders.length === 0, offenders.join('; '));
  } catch (e) {
    record('TAD-14', 'The PEP override is a floor and never a ceiling', false, String(e));
  }
}

async function checkJurisdictionTable(): Promise<void> {
  // The generated module runs its own two startup assertions (§C.4,
  // §D.2.3) as top-level code the moment it's imported — 177 rows exactly,
  // and exactly one Low row which is the United States, each with the
  // derived band cross-checked against the source's own asserted band. A
  // successful import therefore already proves this check; this function
  // exists to surface that as a labelled pass/fail line rather than a
  // silent import.
  try {
    await import('../src/engine/reference/jurisdictions.ts');
    record('TAD-15', "The jurisdiction table's derived bands match its asserted column on all 177 rows, and exactly one row is Low (United States)", true);
  } catch (e) {
    record(
      'TAD-15',
      "The jurisdiction table's derived bands match its asserted column on all 177 rows, and exactly one row is Low (United States)",
      false,
      String(e),
    );
  }
}

async function checkFixtureDdGate(): Promise<void> {
  try {
    execSync('node --experimental-strip-types scripts/generate-fixture.ts', { cwd: ROOT, stdio: 'pipe' });
    record('TAD-19', 'The twenty-two DD-checks of DD §3 (fixture population targets, structural integrity, narrative legibility)', true, 'generate-fixture.ts exited 0 -- all binary DD-checks passed (DD-9 is report-only).');
  } catch (e) {
    const out = e instanceof Error && 'stdout' in e ? String((e as { stdout: Buffer }).stdout) : String(e);
    record('TAD-19', 'The twenty-two DD-checks of DD §3 (fixture population targets, structural integrity, narrative legibility)', false, out.slice(-3000));
  }
}

// --- Population (§L.3 items 20-21, added v1.5) -------------------------------
//
// NAMING NOTE: v1.5's prose numbers these list items 20 and 21, but the
// literal check.ts identifier "TAD-20" was already assigned (by an
// Engineer, ad hoc, matching this script's pre-existing convention where
// literal IDs don't track L.3's prose position 1:1 -- e.g. list item 8 is
// printed as "TAD-20" for the HealthMark/scrim rule). Using the document's
// suggested "TAD-20"/"TAD-21" literally here would collide with that
// existing, already-gated check. TAD-21 and TAD-22 are free; used here.
// The register-arrangement check v1.5 calls "TAD-22" is therefore free at
// TAD-23 when it's built -- not built here, since register layout is
// phase 1's surface, not phase 3's data layer.
async function checkPopulationInvariants(): Promise<void> {
  const { buildSnapshot } = await import('../src/data/snapshot.ts');
  try {
    const snapshot = buildSnapshot();
    const deepestReach = addDaysCheck(snapshot.asOf, -395);
    record(
      'TAD-21',
      'bookCutoff <= addDays(asOf, -395), and book and intake partition the snapshot with no record on both sides and none on neither',
      snapshot.meta.bookCutoff <= deepestReach,
      `bookCutoff=${snapshot.meta.bookCutoff} deepestReach=${deepestReach}`,
    );

    const yearStart = addDaysCheck(snapshot.asOf, -395);
    const yearEnd = addDaysCheck(snapshot.asOf, -365);
    const contaminated = snapshot.records.filter(
      (r) => r.onboardedAt <= snapshot.meta.bookCutoff && r.onboardedAt > yearStart && r.onboardedAt <= yearEnd,
    );
    record(
      'TAD-22',
      "The deepest intake window -- the Board's Year as-at -- returns no record dated on or before bookCutoff",
      contaminated.length === 0,
      `${contaminated.length} contaminating record(s)`,
    );
  } catch (e) {
    record('TAD-21', 'bookCutoff <= addDays(asOf, -395), and book and intake partition the snapshot', false, String(e));
  }
}

function addDaysCheck(d: string, n: number): string {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
}

// --- TAD-23 (§L.4.5, §D.5.16) — the register's exact enumerated       --
// arrangement, including the single-element exception. Reserved as an   --
// open slot when TAD-21/22 were added (v1.5's own numbering collided    --
// with the pre-existing TAD-20); built now, 26 Aug 2026, alongside the  --
// fix -- RegisterField.tsx never actually implemented the exception,    --
// only the strict break, despite it being Coordinator-approved since    --
// 23 August. This is what stops that regressing silently again.        --
const EXPECTED_REGISTER_ARRANGEMENT: readonly (readonly string[])[] = [
  ['ewra', 'emerging-risk'],
  ['kyc', 'edd', 'tm'],
  ['investigations', 'regulatory-reporting'],
  ['sanctions-program', 'abc-program'],
  ['screening', 'governance', 'staffing'],
  ['training', 'qa', 'exam-audit-mgmt'],
  ['issue-mgmt', 'change-mgmt'],
  ['data-management', 'models-non-model-tools', 'information-sharing'],
  ['recordkeeping', 'risk-appetite-statement'],
  ['board-reporting', 'risk-committee-reporting'],
];

function checkRegisterArrangement(): void {
  const path = join(ROOT, 'src', 'generated', 'declarations.generated.json');
  try {
    const doc = JSON.parse(readFileSync(path, 'utf-8')) as {
      declarations: { id: string; status: string; placement: { band: string; group: string | null } }[];
    };
    const register = doc.declarations.filter((d) => d.placement.band === 'program-elements');

    // Reproduce packIntoRows' algorithm exactly (RegisterField.tsx), over
    // the generated data rather than importing the .tsx component.
    const clusters: { group: string | null; items: string[] }[] = [];
    for (const d of register) {
      const last = clusters[clusters.length - 1];
      if (!last || last.group !== d.placement.group) clusters.push({ group: d.placement.group, items: [d.id] });
      else last.items.push(d.id);
    }
    const rows: string[][] = [];
    let pending: string[] = [];
    clusters.forEach((cluster, i) => {
      const remaining = [...cluster.items];
      if (pending.length > 0) {
        rows.push([...pending, ...remaining.splice(0, 1)]);
        pending = [];
      }
      while (remaining.length > 3) rows.push(remaining.splice(0, 3));
      const isLast = i === clusters.length - 1;
      if (remaining.length === 1 && !isLast) pending = remaining;
      else if (remaining.length > 0) rows.push(remaining);
    });
    if (pending.length > 0) rows.push(pending);

    const matches =
      rows.length === EXPECTED_REGISTER_ARRANGEMENT.length &&
      rows.every((row, i) => JSON.stringify(row) === JSON.stringify(EXPECTED_REGISTER_ARRANGEMENT[i]));

    record(
      'TAD-23',
      "The register's exact enumerated arrangement (§L.4.5), including the single-element exception at the Data/Governance boundary",
      matches,
      matches ? '' : `got ${JSON.stringify(rows)}`,
    );
  } catch (e) {
    record('TAD-23', "The register's exact enumerated arrangement (§L.4.5)", false, String(e));
  }
}

// --- Build itself -----------------------------------------------------------

function checkBuild(): void {
  try {
    execSync('npm run build', { cwd: ROOT, stdio: 'pipe' });
    record('TAD-BUILD', 'npm run build (vite build) succeeds', true);
  } catch (e) {
    const out = e instanceof Error && 'stdout' in e ? String((e as { stdout: Buffer }).stdout) : String(e);
    record('TAD-BUILD', 'npm run build', false, out.slice(0, 2000));
  }
}

// --- Run --------------------------------------------------------------------

checkNoRawColorLiterals();
checkNoRawPxOutsideTokens();
checkNoInkSecondaryUnderScrim();
checkNoShellImportOfEngineReference();
checkEngineIsHeadless();
checkHealthMarkIsOnlyStatusColorReference();
checkGeneratedFileHeader();
checkDeclarationGateConditions();
await checkWorkedExamples();
await checkBandBoundaries();
await checkPepFloorNeverCeiling();
await checkJurisdictionTable();
await checkFixtureDdGate();
await checkPopulationInvariants();
checkRegisterArrangement();
checkTypecheck();
checkLint();
checkVitest();
checkBuild();

console.log('\n=== npm run check ===\n');
let allPass = true;
for (const r of results) {
  const mark = r.pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${r.id} — ${r.description}`);
  if (!r.pass && r.detail) console.log(`       ${r.detail}`);
  if (!r.pass) allPass = false;
}
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} checks passed.`);

if (!allPass) process.exit(1);
