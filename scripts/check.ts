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
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;
      // Strip a trailing inline comment before checking for px literals —
      // a px value mentioned in prose (e.g. explaining a bug) is not a
      // style declaration.
      const codeOnly = trimmed.replace(/\/\*.*?\*\//g, '').trim();
      if (exemptPatterns.some((p) => p.test(trimmed))) continue;
      const matches = codeOnly.match(pxPattern);
      if (matches) offenders.push(`${f.replace(ROOT + '/', '')}: "${trimmed}"`);
    }
  }
  record('TAD-5', 'No raw px spacing/sizing values outside src/design/tokens.css', offenders.length === 0, offenders.join('; '));
}

function checkNoInkSecondaryUnderScrim(): void {
  // Defensive grep: ElementTile is the one file allowed to reference
  // --ink-secondary conditionally, and only ever for the non-live
  // (unscrimmed) path. A literal 'var(--ink-secondary)' hardcoded onto a
  // scrimmed element elsewhere in src/shell is exactly the mistake TAD
  // Handoff point 5 warns about.
  const files = walk(join(ROOT, 'src', 'shell'), ['.tsx']);
  const offenders: string[] = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf-8');
    if (content.includes("className={`element-tile") || content.includes('scrim')) {
      if (/color:\s*['"]var\(--ink-secondary\)['"]/.test(content) && !content.includes('bodyInk')) {
        offenders.push(f.replace(ROOT + '/', ''));
      }
    }
  }
  record(
    'TAD-6',
    'No hardcoded --ink-secondary on a scrimmed element (primary ink required, see Handoff #5)',
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
checkHealthMarkIsOnlyStatusColorReference();
checkGeneratedFileHeader();
checkDeclarationGateConditions();
checkTypecheck();
checkLint();
checkVitest();
checkBuild();

// TODO — added once the engine exists (phase 2, TAD §L.3):
//   TAD-1..3   engine unit checks (band boundaries, PEP override, route)
//   TAD-10     jurisdiction table: 177 rows, exactly one Low (US)
//   TAD-12..16 the twelve worked examples reproduce exactly (binary gate)
//   TAD-18..19 fixture population tolerances (checks 4-9)

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
