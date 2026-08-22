// TAD §D.4.5 — loadInactiveDeclarations(). Parses the generated JSON into
// typed declarations, attaches defaultSchema() to each, and re-runs the
// generator's gate conditions at runtime. The generator already validated
// this data; re-validating at load turns "someone hand-edited a generated
// file" into a named error rather than a mystery on screen.
// Import attribute required for this file to run identically under Vite
// (the browser bundle) and under plain `node --experimental-strip-types`
// (scripts/check.ts, §D.1.3, which imports "the declaration loader"
// directly) — Node's own ESM loader requires `with { type: 'json' }` for
// JSON imports; Vite/esbuild accept the same syntax.
import generatedFile from '../generated/declarations.generated.json' with { type: 'json' };
import { defaultSchema } from './schema.ts';
import type { ByHorizon, ElementContent, HeroSlot, ModuleDeclaration, TrendSlot } from './types.ts';

export class DeclarationLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeclarationLoadError';
  }
}

type GeneratedHeroSlot = { kind: 'authored'; value: number | string; unit: string } | { kind: 'computed' } | { kind: 'absent' };
type GeneratedTrendSlot = { kind: 'authored'; value: string } | { kind: 'computed' } | { kind: 'absent' };
type GeneratedHealthSlot = { kind: 'authored'; value: 'Red' | 'Amber' | 'Green' } | { kind: 'absent' };

interface GeneratedElementContent {
  title: string;
  metricHeader: string | null;
  hero: GeneratedHeroSlot;
  trend: GeneratedTrendSlot;
  health: GeneratedHealthSlot;
  feedCaption: string;
}

interface GeneratedDeclaration {
  id: string;
  status: 'live' | 'inactive';
  placement: { band: 'business-risk' | 'program-elements'; group: string | null; order: number };
  content: { month: GeneratedElementContent; quarter: GeneratedElementContent; year: GeneratedElementContent };
}

function reconstructHero(slot: GeneratedHeroSlot, id: string): HeroSlot {
  if (slot.kind === 'computed') {
    // A computed slot carries a function; generated JSON cannot hold one
    // (TAD §D.4.1). Only the live module is permitted to be 'computed' in
    // the source workbook, and the live module supplies its own resolver
    // via src/modules/kyc-intake/declaration.ts rather than going through
    // this loader — this path is for the 25 inactive declarations only.
    throw new DeclarationLoadError(
      `Element "${id}" has a 'computed' slot but is being loaded as an inactive declaration. Only the live module may be computed.`,
    );
  }
  return slot;
}

const VALID_TREND_VALUES = ['Increasing', 'Stable', 'Decreasing'] as const;

function reconstructTrend(slot: GeneratedTrendSlot, id: string): TrendSlot {
  if (slot.kind === 'computed') {
    throw new DeclarationLoadError(
      `Element "${id}" has a 'computed' trend slot but is being loaded as an inactive declaration.`,
    );
  }
  if (slot.kind === 'authored') {
    if (!(VALID_TREND_VALUES as readonly string[]).includes(slot.value)) {
      throw new DeclarationLoadError(`Element "${id}" has an invalid trend value "${slot.value}".`);
    }
    return { kind: 'authored', value: slot.value as (typeof VALID_TREND_VALUES)[number] };
  }
  return slot;
}

const EMPTY_HORIZON_LEGEND = { month: '', quarter: '', year: '' } as const;

function reconstructContent(c: GeneratedElementContent, id: string): ElementContent {
  return {
    title: c.title,
    metricHeader: c.metricHeader,
    hero: reconstructHero(c.hero, id),
    trend: reconstructTrend(c.trend, id),
    health: c.health,
    feedCaption: c.feedCaption,
  };
}

export function loadInactiveDeclarations(): readonly ModuleDeclaration[] {
  const doc = generatedFile as unknown as { declarations: GeneratedDeclaration[] };
  const all = doc.declarations;

  if (!Array.isArray(all) || all.length !== 26) {
    throw new DeclarationLoadError(`Expected 26 generated declarations, found ${Array.isArray(all) ? all.length : 'malformed data'}.`);
  }

  const inactive = all.filter((d) => d.status === 'inactive');
  if (inactive.length !== 25) {
    throw new DeclarationLoadError(`Expected 25 inactive declarations, found ${inactive.length}.`);
  }

  return inactive.map((d): ModuleDeclaration => {
    const content: ByHorizon<ElementContent> = {
      month: reconstructContent(d.content.month, d.id),
      quarter: reconstructContent(d.content.quarter, d.id),
      year: reconstructContent(d.content.year, d.id),
    };
    return {
      id: d.id,
      status: 'inactive',
      placement: d.placement,
      content,
      legend: [], // inactive elements never become the active context; never read
      horizonLegend: EMPTY_HORIZON_LEGEND, // same — never read for inactive declarations
      schema: defaultSchema(),
    };
  });
}

// Exposed so src/modules/kyc-intake/declaration.ts can pull the Customers
// row's authored content (title, metric header, feed caption, health) and
// merge it with the module's own capabilities (TAD §C.1, §D.6.1).
export function loadLiveElementSource(id: string): {
  content: { month: GeneratedElementContent; quarter: GeneratedElementContent; year: GeneratedElementContent };
} {
  const doc = generatedFile as unknown as { declarations: GeneratedDeclaration[] };
  const found = doc.declarations.find((d) => d.id === id && d.status === 'live');
  if (!found) {
    throw new DeclarationLoadError(`No live declaration found with id "${id}".`);
  }
  return { content: found.content };
}
