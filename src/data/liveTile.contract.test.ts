// TAD §J.3's exit condition: "the Customers tile's hero and trend derive
// live at all three Board horizons and reproduce §3's as-at set within
// tolerance." A numeric tolerance claim needs an automated check, not a
// look at a screenshot — this is that check. Picked up by the existing
// TAD-11c line in check.ts (npx vitest run), so no new check.ts entry or
// TAD.md amendment is needed for it.
import { describe, expect, it } from 'vitest';
import { buildSnapshot } from '../data/snapshot.ts';
import { createFixtureDataAccess } from '../data/fixtureDataAccess.ts';
import { asAtHighShare } from '../modules/kyc-intake/selectors.ts';

const addDays = (d: string, n: number): string => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, day + n)).toISOString().slice(0, 10);
};

describe('the Customers live tile — Board as-at, DD §3 / DD-5, DD-6a', () => {
  const snapshot = buildSnapshot();
  const data = createFixtureDataAccess(snapshot);
  const today = data.meta().asOf;

  it('Month (offset 0) lands within DD-5\'s ±1pp of 11.0%', () => {
    const value = asAtHighShare(data, today);
    expect(value).toBeGreaterThanOrEqual(11.0 - 1);
    expect(value).toBeLessThanOrEqual(11.0 + 1);
  });

  it('Quarter (offset 90) lands within DD-6a\'s ±0.7pp of 6.3%', () => {
    const value = asAtHighShare(data, addDays(today, -90));
    expect(value).toBeGreaterThanOrEqual(6.3 - 0.7);
    expect(value).toBeLessThanOrEqual(6.3 + 0.7);
  });

  it('Year (offset 365) lands within DD-6a\'s ±0.5pp of 4.8%', () => {
    const value = asAtHighShare(data, addDays(today, -365));
    expect(value).toBeGreaterThanOrEqual(4.8 - 0.5);
    expect(value).toBeLessThanOrEqual(4.8 + 0.5);
  });
});
