// TAD §C.2 — "its job is to fail compilation" if anyone declares a
// thirteen-field interface. This file contains no runtime assertions worth
// speaking of; a three-row schema and a fifteen-row renamed schema both
// satisfying `DeclarationSchema` and passing through the same code path the
// build uses is the entire claim. `npm run typecheck` / `tsc --noEmit`
// (TAD-11, §L.3) is what actually enforces this — the `it()` below exists
// so vitest also reports it, per §D.4.2's "consumed by ... every run
// thereafter."
import { describe, expect, it } from 'vitest';
import type { DeclarationSchema } from './schema.ts';

const threeRowSchema: DeclarationSchema = [
  { id: 'row-1', label: 'Only Row One', content: null },
  { id: 'row-2', label: 'Only Row Two', content: 'populated' },
  { id: 'row-3', label: 'Only Row Three', content: null },
];

const fifteenRowRenamedSchema: DeclarationSchema = Array.from({ length: 15 }, (_, i) => ({
  id: `custom-row-${i + 1}`,
  label: `Renamed Requirement ${i + 1}`,
  content: i % 2 === 0 ? `content ${i + 1}` : null,
}));

function acceptsAnyDeclarationSchema(schema: DeclarationSchema): number {
  return schema.length;
}

describe('DeclarationSchema seed contract (TAD §C.2)', () => {
  it('accepts a 3-row schema through the same code path the build uses', () => {
    expect(acceptsAnyDeclarationSchema(threeRowSchema)).toBe(3);
  });

  it('accepts a 15-row, entirely renamed schema through the same code path', () => {
    expect(acceptsAnyDeclarationSchema(fifteenRowRenamedSchema)).toBe(15);
  });
});
