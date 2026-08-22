// TAD §D.1.1 — scripts/generate-declarations.ts
//
// Reads the three Appendix B workbooks and emits
// src/generated/declarations.generated.json plus a manifest recording each
// workbook's filename and SHA-256. Run by `npm run generate:declarations`.
// Build-time only; never runs during `vite build`.
//
// Dependencies: exceljs; src/declarations/types.ts; src/declarations/schema.ts.
// Imports nothing from src/shell or src/modules.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import type { BandId, Unit } from '../src/declarations/types.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');

const HORIZONS = ['month', 'quarter', 'year'] as const;
type HorizonKey = (typeof HORIZONS)[number];

const WORKBOOK_FILES: Record<HorizonKey, string> = {
  month: 'Tile_Content_Appendix_B_MONTH_21AUG26.xlsx',
  quarter: 'Tile_Content_Appendix_B_QUARTER_21AUG26.xlsx',
  year: 'Tile_Content_Appendix_B_YEAR_21AUG26.xlsx',
};

const FIRST_ELEMENT_ROW = 11;
const ELEMENT_COUNT = 26;
const LAST_ELEMENT_ROW = FIRST_ELEMENT_ROW + ELEMENT_COUNT - 1; // 36

// TAD §C.1 — bands are shell data; presentation is a property of the band.
const BAND_PRESENTATION: Record<BandId, 'Tile' | 'Register Row'> = {
  'business-risk': 'Tile',
  'program-elements': 'Register Row',
};

const BAND_LABEL_TO_ID: Record<string, BandId> = {
  'Business Risk': 'business-risk',
  'Program Elements': 'program-elements',
};

const VALID_UNITS: readonly Unit[] = ['%', 'count', 'Days'];
const VALID_TRENDS = ['Increasing', 'Stable', 'Decreasing'] as const;
const VALID_HEALTH = ['Red', 'Amber', 'Green'] as const;

// TAD §L.4.3 — element ids, derived once at transcription and never
// re-derived at runtime.
function toId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// TAD §D.1.1, Implementation Note — collapse runs of internal whitespace to
// one and trim. General spreadsheet-string hygiene, reported when it fires.
function collapseWhitespace(raw: string): { value: string; changed: boolean } {
  const value = raw.replace(/\s+/g, ' ').trim();
  return { value, changed: value !== raw };
}

interface Fatal {
  gate: number;
  message: string;
}

const fatals: Fatal[] = [];
const whitespaceReports: string[] = [];
const overBudgetReports: string[] = [];

function fail(gate: number, message: string): void {
  fatals.push({ gate, message });
}

function cellString(row: ExcelJS.Row, col: number, sheetLabel: string, rowNum: number): string {
  const raw = row.getCell(col).value;
  if (raw === null || raw === undefined) return '';
  const str = typeof raw === 'object' && raw !== null && 'text' in raw
    ? String((raw as { text: unknown }).text)
    : String(raw);
  const { value, changed } = collapseWhitespace(str);
  if (changed) {
    whitespaceReports.push(`${sheetLabel} row ${rowNum}: whitespace collapsed in "${str}" -> "${value}"`);
  }
  return value;
}

interface RawRow {
  num: number | string | null;
  element: string;
  band: string;
  group: string;
  presentation: string;
  status: string;
  metricHeader: string;
  heroValue: string; // may be numeric-as-string, 'computed', or 'n/a'
  heroValueRaw: ExcelJS.CellValue;
  unit: string;
  trend: string;
  health: string;
  feedCaption: string;
}

async function readWorkbook(horizon: HorizonKey): Promise<{ rows: RawRow[]; hash: string; filename: string }> {
  const filename = WORKBOOK_FILES[horizon];
  const path = join(REPO_ROOT, 'content', filename);
  const bytes = readFileSync(path);
  const hash = createHash('sha256').update(bytes).digest('hex');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    fail(1, `${filename}: no worksheet found`);
    return { rows: [], hash, filename };
  }

  const sheetLabel = horizon.toUpperCase();
  const rows: RawRow[] = [];
  for (let r = FIRST_ELEMENT_ROW; r <= LAST_ELEMENT_ROW; r++) {
    const row = sheet.getRow(r);
    rows.push({
      num: row.getCell(1).value as number | string | null,
      element: cellString(row, 2, sheetLabel, r),
      band: cellString(row, 3, sheetLabel, r),
      group: cellString(row, 4, sheetLabel, r),
      presentation: cellString(row, 5, sheetLabel, r),
      status: cellString(row, 6, sheetLabel, r),
      metricHeader: cellString(row, 7, sheetLabel, r),
      heroValue: cellString(row, 8, sheetLabel, r),
      heroValueRaw: row.getCell(8).value,
      unit: cellString(row, 9, sheetLabel, r),
      trend: cellString(row, 10, sheetLabel, r),
      health: cellString(row, 11, sheetLabel, r),
      feedCaption: cellString(row, 12, sheetLabel, r),
    });
  }

  // Gate 1 (part): 26 element rows present and readable.
  const nonEmpty = rows.filter((r) => r.element !== '');
  if (nonEmpty.length !== ELEMENT_COUNT) {
    fail(1, `${filename}: expected ${ELEMENT_COUNT} element rows, found ${nonEmpty.length}`);
  }

  return { rows, hash, filename };
}

type HeroSlotJSON =
  | { kind: 'authored'; value: number | string; unit: string }
  | { kind: 'computed' }
  | { kind: 'absent' };

type TrendSlotJSON =
  | { kind: 'authored'; value: string }
  | { kind: 'computed' }
  | { kind: 'absent' };

type HealthSlotJSON =
  | { kind: 'authored'; value: 'Red' | 'Amber' | 'Green' }
  | { kind: 'absent' };

interface ElementContentJSON {
  title: string;
  metricHeader: string | null;
  hero: HeroSlotJSON;
  trend: TrendSlotJSON;
  health: HealthSlotJSON;
  feedCaption: string;
}

interface GeneratedDeclarationJSON {
  id: string;
  status: 'live' | 'inactive';
  placement: { band: BandId; group: string | null; order: number };
  content: { month: ElementContentJSON; quarter: ElementContentJSON; year: ElementContentJSON };
}

function mapHero(row: RawRow, sheetLabel: string, rowNum: number, elementTitle: string): HeroSlotJSON {
  if (row.heroValue === 'computed') return { kind: 'computed' };
  if (row.heroValue === 'n/a' || row.heroValue === '') return { kind: 'absent' };
  if (!VALID_UNITS.includes(row.unit as Unit)) {
    fail(4, `${sheetLabel} row ${rowNum} (${elementTitle}): Unit / format "${row.unit}" not in {%, count, Days, n/a}`);
  }
  const numeric = typeof row.heroValueRaw === 'number' ? row.heroValueRaw : Number(row.heroValue);
  const value = Number.isFinite(numeric) ? numeric : row.heroValue;
  return { kind: 'authored', value, unit: row.unit };
}

function mapTrend(row: RawRow, sheetLabel: string, rowNum: number, elementTitle: string): TrendSlotJSON {
  if (row.trend === 'computed') return { kind: 'computed' };
  if (row.trend === 'None') return { kind: 'absent' };
  if (!(VALID_TRENDS as readonly string[]).includes(row.trend)) {
    fail(4, `${sheetLabel} row ${rowNum} (${elementTitle}): Trend "${row.trend}" not in {Increasing, Stable, Decreasing, None, computed}`);
  }
  return { kind: 'authored', value: row.trend };
}

function mapHealth(row: RawRow, sheetLabel: string, rowNum: number, elementTitle: string): HealthSlotJSON {
  if (row.health === 'None') return { kind: 'absent' };
  if (!(VALID_HEALTH as readonly string[]).includes(row.health)) {
    fail(4, `${sheetLabel} row ${rowNum} (${elementTitle}): Health "${row.health}" not in {Red, Amber, Green, None}`);
  }
  return { kind: 'authored', value: row.health as 'Red' | 'Amber' | 'Green' };
}

// TAD §D.1.1 gate 9 — character budgets, by presentation.
function checkBudgets(title: string, presentation: 'Tile' | 'Register Row', horizonContent: ElementContentJSON, horizon: string): void {
  if (title.length > 28) {
    overBudgetReports.push(`${title} [title, all horizons]: ${title.length} of 28`);
  }
  const metricHeader = horizonContent.metricHeader ?? '';
  const feedCaption = horizonContent.feedCaption;
  if (presentation === 'Register Row') {
    const line2 = `${metricHeader} · ${feedCaption}`;
    if (line2.length > 62) {
      overBudgetReports.push(`${title} [${horizon}, register line 2]: ${line2.length} of 62`);
    }
  } else {
    if (metricHeader.length > 60) {
      overBudgetReports.push(`${title} [${horizon}, tile metric header]: ${metricHeader.length} of 60`);
    }
    if (feedCaption.length > 60) {
      overBudgetReports.push(`${title} [${horizon}, tile caption]: ${feedCaption.length} of 60`);
    }
  }
}

async function main(): Promise<void> {
  const byHorizon: Record<HorizonKey, RawRow[]> = { month: [], quarter: [], year: [] };
  const hashes: Record<HorizonKey, { filename: string; sha256: string }> = {
    month: { filename: '', sha256: '' },
    quarter: { filename: '', sha256: '' },
    year: { filename: '', sha256: '' },
  };

  for (const horizon of HORIZONS) {
    const { rows, hash, filename } = await readWorkbook(horizon);
    byHorizon[horizon] = rows;
    hashes[horizon] = { filename, sha256: hash };
  }

  if (fatals.length > 0) {
    reportAndExit();
    return;
  }

  const declarations: GeneratedDeclarationJSON[] = [];
  const seenIds = new Set<string>();
  let liveCount = 0;
  const businessRiskGroupDashCount = { month: 0 };
  const groupCounts: Record<string, number> = {};

  for (let i = 0; i < ELEMENT_COUNT; i++) {
    const monthRow = byHorizon.month[i]!;
    const quarterRow = byHorizon.quarter[i]!;
    const yearRow = byHorizon.year[i]!;
    const rowNum = FIRST_ELEMENT_ROW + i;

    // Gate 2 — structural columns identical across the three files.
    const structuralCols: (keyof RawRow)[] = ['element', 'band', 'group', 'presentation', 'status'];
    for (const col of structuralCols) {
      if (monthRow[col] !== quarterRow[col] || monthRow[col] !== yearRow[col]) {
        fail(2, `Row ${rowNum}: "${col}" diverges across horizons (month="${monthRow[col]}" quarter="${quarterRow[col]}" year="${yearRow[col]}")`);
      }
    }

    const elementTitle = monthRow.element;

    // Gate 6 tally
    if (monthRow.status === 'LIVE') liveCount++;

    // Band
    const bandId = BAND_LABEL_TO_ID[monthRow.band];
    if (!bandId) {
      fail(4, `Row ${rowNum} (${elementTitle}): Band "${monthRow.band}" not in {Business Risk, Program Elements}`);
      continue;
    }

    // Gate 3 — Presentation cross-check only, never stored.
    if (monthRow.presentation !== BAND_PRESENTATION[bandId]) {
      fail(3, `Row ${rowNum} (${elementTitle}): Presentation "${monthRow.presentation}" does not match band "${monthRow.band}"'s declared presentation "${BAND_PRESENTATION[bandId]}"`);
    }

    // Gate 7 — Group is '-' for exactly the two Business Risk rows.
    if (bandId === 'business-risk') {
      if (monthRow.group !== '-') {
        fail(7, `Row ${rowNum} (${elementTitle}): Business Risk row must have Group "-", found "${monthRow.group}"`);
      } else {
        businessRiskGroupDashCount.month++;
      }
    } else {
      if (monthRow.group === '-' || monthRow.group === '') {
        fail(7, `Row ${rowNum} (${elementTitle}): Program Elements row must have a named Group, found "${monthRow.group}"`);
      } else {
        groupCounts[monthRow.group] = (groupCounts[monthRow.group] ?? 0) + 1;
      }
    }

    // Gate 5 — no blank cell in any content column. A blank is not 'None'.
    const contentCols: [string, string][] = [
      ['Metric header', monthRow.metricHeader], ['Hero value', monthRow.heroValue], ['Unit / format', monthRow.unit],
      ['Trend', monthRow.trend], ['Health', monthRow.health], ['Feed caption', monthRow.feedCaption],
    ];
    for (const [colName, val] of contentCols) {
      if (val === '') {
        fail(5, `Row ${rowNum} (${elementTitle}): "${colName}" is blank (blank is not "None" or "n/a" — DD Appendix B)`);
      }
    }

    // Gate 4 — Status enum
    if (monthRow.status !== 'LIVE' && monthRow.status !== 'Inactive') {
      fail(4, `Row ${rowNum} (${elementTitle}): Status "${monthRow.status}" not in {LIVE, Inactive}`);
    }

    const status: 'live' | 'inactive' = monthRow.status === 'LIVE' ? 'live' : 'inactive';
    const presentation = BAND_PRESENTATION[bandId];

    const contentFor = (row: RawRow, sheetLabel: string): ElementContentJSON => {
      const content: ElementContentJSON = {
        title: elementTitle,
        metricHeader: row.metricHeader === 'None' ? null : row.metricHeader,
        hero: mapHero(row, sheetLabel, rowNum, elementTitle),
        trend: mapTrend(row, sheetLabel, rowNum, elementTitle),
        health: mapHealth(row, sheetLabel, rowNum, elementTitle),
        feedCaption: row.feedCaption,
      };
      return content;
    };

    const monthContent = contentFor(monthRow, 'MONTH');
    const quarterContent = contentFor(quarterRow, 'QUARTER');
    const yearContent = contentFor(yearRow, 'YEAR');

    checkBudgets(elementTitle, presentation, monthContent, 'month');
    checkBudgets(elementTitle, presentation, quarterContent, 'quarter');
    checkBudgets(elementTitle, presentation, yearContent, 'year');

    // Gate 8 — element ids unique and stable.
    const id = toId(elementTitle);
    if (seenIds.has(id)) {
      fail(8, `Row ${rowNum} (${elementTitle}): id "${id}" collides with an earlier element`);
    }
    seenIds.add(id);

    declarations.push({
      id,
      status,
      placement: { band: bandId, group: bandId === 'business-risk' ? null : monthRow.group, order: i },
      content: { month: monthContent, quarter: quarterContent, year: yearContent },
    });
  }

  // Gate 6 — exactly one LIVE row.
  if (liveCount !== 1) {
    fail(6, `Expected exactly 1 row with Status = LIVE, found ${liveCount}`);
  }

  reportAndExit(declarations, hashes);
}

function reportAndExit(
  declarations?: GeneratedDeclarationJSON[],
  hashes?: Record<HorizonKey, { filename: string; sha256: string }>,
): void {
  if (whitespaceReports.length > 0) {
    console.log('Whitespace collapsed (hygiene, non-fatal):');
    whitespaceReports.forEach((r) => console.log(`  ${r}`));
  }

  if (overBudgetReports.length > 0) {
    console.log('\nOver-budget rows (provisional early warning, non-fatal — authoritative check is OverflowSentinel at the phase 1 exit, TAD §D.1.1):');
    overBudgetReports.forEach((r) => console.log(`  ${r}`));
  } else {
    console.log('\nCharacter budgets: all 26 elements clear their own budgets on all three horizons.');
  }

  if (fatals.length > 0) {
    console.error(`\n${fatals.length} gate condition(s) FAILED:`);
    fatals.forEach((f) => console.error(`  [gate ${f.gate}] ${f.message}`));
    process.exit(1);
  }

  if (!declarations || !hashes) {
    process.exit(1);
    return;
  }

  const outDir = join(REPO_ROOT, 'src', 'generated');
  mkdirSync(outDir, { recursive: true });

  // Plain JSON has no comment syntax, and this file is consumed via a
  // native JSON import (Vite) as well as JSON.parse (load.ts), both of
  // which require strict JSON. The "generated — do not edit" header
  // (TAD-9, §L.3) therefore lives as a field inside the document rather
  // than a leading comment, so the file stays valid JSON while still
  // grep-able and human-visible on open.
  const outPath = join(outDir, 'declarations.generated.json');
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        _generated: 'GENERATED — DO NOT EDIT. Produced by scripts/generate-declarations.ts from the three Appendix B workbooks in content/. A content change is a workbook edit followed by a regeneration, in that order (TAD §D.1.1).',
        declarations,
      },
      null,
      2,
    ) + '\n',
  );

  const manifestPath = join(outDir, 'declarations.manifest.json');
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        workbooks: hashes,
      },
      null,
      2,
    ) + '\n',
  );

  console.log(`\n${declarations.length} declarations written to ${outPath.replace(REPO_ROOT + '/', '')}`);
  console.log(`Manifest written to ${manifestPath.replace(REPO_ROOT + '/', '')}`);
  console.log('All 9 gate conditions passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
