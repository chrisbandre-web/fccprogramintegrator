// TAD §D.1.1b — reads content/Country_Risk_Ratings_20AUG26.docx (the
// 177-row jurisdiction table, canonical, verbatim) and emits
// src/engine/reference/jurisdictions.ts. Run once by
// `npm run generate:jurisdictions`; build-time only, never part of
// `vite build`. Same discipline as generate-declarations.ts: the source
// document is canonical, the generated file is never hand-edited, a
// content change is a source-document edit followed by a regeneration.
//
// Dependency-free by design (TAD §B.1's razor: a permanent cost for an
// occasional benefit). A .docx is a zip archive of small deflate-compressed
// XML parts; rather than add a docx-parsing devDependency for a one-time
// job, this reads the ZIP central directory and inflates the single part
// it needs (word/document.xml) with Node's built-in zlib, then extracts
// the one <w:tbl> with a small, purpose-built regex walk — no general XML
// parser, because the only structure this ever has to understand is
// <w:tbl>/<w:tr>/<w:tc>/<w:t>.

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCE_PATH = join(ROOT, 'content', 'Country_Risk_Ratings_20AUG26.docx');
const OUTPUT_PATH = join(ROOT, 'src', 'engine', 'reference', 'jurisdictions.ts');

const SOURCE = 'Basel AML Index, Public Edition';
const EDITION = '2025';
const ACCESSED = '2026-08-20';
const THRESHOLD = '> 5.00';

function fail(message: string): never {
  console.error(`FAIL generate-jurisdictions: ${message}`);
  process.exit(1);
}

// --- Minimal ZIP reader: locate one named part and inflate it -------------

function readZipEntry(zipBuf: Buffer, entryName: string): Buffer {
  // End Of Central Directory record: signature 0x06054b50, in the last
  // 22..~65KB of the file (comment field is variable-length). Search from
  // the end since nothing else in a well-formed docx produces this
  // 4-byte sequence.
  const EOCD_SIG = 0x06054b50;
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i--) {
    if (zipBuf.readUInt32LE(i) === EOCD_SIG) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) fail('not a valid ZIP (.docx) file — no End Of Central Directory record found');

  const centralDirOffset = zipBuf.readUInt32LE(eocdOffset + 16);
  const totalEntries = zipBuf.readUInt16LE(eocdOffset + 10);

  const CENTRAL_SIG = 0x02014b50;
  let pos = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (zipBuf.readUInt32LE(pos) !== CENTRAL_SIG) fail(`corrupt central directory entry ${i}`);
    const compressionMethod = zipBuf.readUInt16LE(pos + 10);
    const compressedSize = zipBuf.readUInt32LE(pos + 20);
    const fileNameLength = zipBuf.readUInt16LE(pos + 28);
    const extraFieldLength = zipBuf.readUInt16LE(pos + 30);
    const commentLength = zipBuf.readUInt16LE(pos + 32);
    const localHeaderOffset = zipBuf.readUInt32LE(pos + 42);
    const fileName = zipBuf.toString('utf-8', pos + 46, pos + 46 + fileNameLength);

    if (fileName === entryName) {
      // Local file header precedes the data; its own name/extra field
      // lengths can differ in padding from the central directory's, so
      // they're read fresh rather than assumed to match.
      const LOCAL_SIG = 0x04034b50;
      if (zipBuf.readUInt32LE(localHeaderOffset) !== LOCAL_SIG) fail(`corrupt local file header for ${entryName}`);
      const localNameLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressed = zipBuf.subarray(dataStart, dataStart + compressedSize);
      if (compressionMethod === 0) return Buffer.from(compressed); // stored, no compression
      if (compressionMethod === 8) return inflateRawSync(compressed); // deflate
      fail(`unsupported ZIP compression method ${compressionMethod} for ${entryName}`);
    }

    pos += 46 + fileNameLength + extraFieldLength + commentLength;
  }
  fail(`entry not found in archive: ${entryName}`);
}

// --- Minimal OOXML table extraction ----------------------------------------

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&'); // last, so decoded entities above can't themselves introduce a bare '&'
}

function cellText(cellXml: string): string {
  // The tag-name boundary matters: `<w:t[^>]*>` would also match `<w:tcPr>`,
  // `<w:tbl>` etc., since `w:t` is a textual prefix of both — matched here
  // only when '>' follows immediately or a space (attributes) does.
  const runs = [...cellXml.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1] ?? '');
  return decodeXmlEntities(runs.join('')).trim();
}

function extractTableRows(documentXml: string): string[][] {
  const tableMatch = documentXml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  if (!tableMatch) fail('no <w:tbl> found in word/document.xml');
  const rowMatches = [...tableMatch[0].matchAll(/<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/g)];
  return rowMatches.map((rowMatch) =>
    [...(rowMatch[1] ?? '').matchAll(/<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/g)].map((c) => cellText(c[1] ?? '')),
  );
}

// --- Run --------------------------------------------------------------------

let zipBuf: Buffer;
try {
  zipBuf = readFileSync(SOURCE_PATH);
} catch {
  fail(`source not found: ${SOURCE_PATH}`);
}

const documentXml = readZipEntry(zipBuf, 'word/document.xml').toString('utf-8');
const rows = extractTableRows(documentXml);
const [header, ...dataRows] = rows;

if (!header || header.length !== 3 || header[0] !== 'Jurisdiction' || header[1] !== 'Overall Score' || header[2] !== 'Risk Rating') {
  fail(`unexpected header row: ${JSON.stringify(header)}`);
}

interface Entry {
  readonly country: string;
  readonly overallScore: number;
  readonly assertedBand: 'High' | 'Medium' | 'Low';
}

const entries: Entry[] = dataRows.map((cells, i) => {
  const [country, scoreStr, band] = cells;
  if (country === undefined || scoreStr === undefined || band === undefined || cells.length !== 3) {
    fail(`row ${i + 1}: expected 3 cells, found ${cells.length} (${JSON.stringify(cells)})`);
  }
  const overallScore = Number(scoreStr);
  if (!Number.isFinite(overallScore)) fail(`row ${i + 1} (${country}): non-numeric score '${scoreStr}'`);
  // TAD §C.4 vocabulary rule: matched exactly including case.
  if (band !== 'High' && band !== 'Medium' && band !== 'Low') {
    fail(`row ${i + 1} (${country}): unrecognised Risk Rating '${band}' — expected exactly 'High', 'Medium' or 'Low'`);
  }
  return { country, overallScore, assertedBand: band };
});

// --- Gate conditions this script must enforce (§D.1.1b) -------------------

if (entries.length !== 177) fail(`expected 177 rows, found ${entries.length}`);

const lowRows = entries.filter((e) => e.assertedBand === 'Low');
if (lowRows.length !== 1 || lowRows[0]?.country !== 'United States') {
  fail(`expected exactly one Low row (United States), found: ${lowRows.map((e) => e.country).join(', ') || 'none'}`);
}

// Fail fast at generation time too, not only at runtime import — same
// derive-vs-assert rule the generated file's own startup assertion applies.
function deriveBand(country: string, overallScore: number): 'High' | 'Medium' | 'Low' {
  if (country === 'United States') return 'Low';
  return overallScore > 5.0 ? 'High' : 'Medium';
}
for (const e of entries) {
  const derived = deriveBand(e.country, e.overallScore);
  if (derived !== e.assertedBand) {
    fail(`${e.country}: derived band '${derived}' disagrees with source Risk Rating '${e.assertedBand}' (score ${e.overallScore})`);
  }
}

// --- Emit -------------------------------------------------------------------

const tableLiteral = entries
  .map((e) => `  { country: ${JSON.stringify(e.country)}, overallScore: ${e.overallScore}, assertedBand: '${e.assertedBand}' },`)
  .join('\n');

const output = `// GENERATED — DO NOT EDIT.
// Produced by scripts/generate-jurisdictions.ts from
// content/Country_Risk_Ratings_20AUG26.docx (TAD §D.1.1b). A content
// change is a source-document edit followed by
// \`npm run generate:jurisdictions\`, in that order — never a hand edit
// here (§D.1.1's generate-and-commit discipline, extended by §D.1.1b).
//
// TAD §C.4, §D.2.3 — engine-internal reference table. Import-restricted:
// nothing outside src/engine/ may import it (§L.3, TAD-2).

export const SOURCE = ${JSON.stringify(SOURCE)};
export const EDITION = ${JSON.stringify(EDITION)};
export const ACCESSED = ${JSON.stringify(ACCESSED)};
export const THRESHOLD = ${JSON.stringify(THRESHOLD)};

export type JurisdictionBand = 'High' | 'Medium' | 'Low'; // CRRM v2.3 §4

interface JurisdictionEntry {
  readonly country: string;
  readonly overallScore: number;
  /** The source document's own Risk Rating column, stored verbatim and untranslated (§C.4). */
  readonly assertedBand: JurisdictionBand;
}

const TABLE: readonly JurisdictionEntry[] = [
${tableLiteral}
];

const BY_COUNTRY = new Map<string, JurisdictionEntry>(TABLE.map((e) => [e.country, e]));

/**
 * CRRM v2.3 §4 / TAD §C.4 — derived, never read. The United States is Low
 * by identity; otherwise strictly-greater-than-5.00 is High, else Medium.
 * A country absent from the table scores High (Coordinator rule, 20 August
 * 2026); the fixture generator is responsible for only ever emitting
 * countries from the closed vocabulary this implies (TAD §C.4).
 */
export function jurisdictionBand(country: string): JurisdictionBand {
  if (country === 'United States') return 'Low';
  const entry = BY_COUNTRY.get(country);
  if (entry === undefined) return 'High';
  return entry.overallScore > 5.0 ? 'High' : 'Medium';
}

// --- Startup assertions (§C.4, §D.2.3) — both hard failures, run once on
// first import, not merely in \`npm run check\` ----------------------------

if (TABLE.length !== 177) {
  throw new Error(\`src/engine/reference/jurisdictions.ts: expected 177 rows, found \${TABLE.length}\`);
}

for (const entry of TABLE) {
  const derived = jurisdictionBand(entry.country);
  if (derived !== entry.assertedBand) {
    throw new Error(
      \`src/engine/reference/jurisdictions.ts: derived band '\${derived}' disagrees with asserted band '\${entry.assertedBand}' for \${entry.country} (score \${entry.overallScore})\`,
    );
  }
}

const lowEntries = TABLE.filter((e) => e.assertedBand === 'Low');
if (lowEntries.length !== 1 || lowEntries[0]?.country !== 'United States') {
  throw new Error(
    \`src/engine/reference/jurisdictions.ts: expected exactly one Low row (United States), found \${lowEntries.length}: \${lowEntries.map((e) => e.country).join(', ')}\`,
  );
}
`;

writeFileSync(OUTPUT_PATH, output, 'utf-8');
console.log(`generate-jurisdictions: wrote ${entries.length} rows to ${OUTPUT_PATH.replace(ROOT + '/', '')}`);
