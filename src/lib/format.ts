// TAD §L.4.6 — one place for hero-value formatting so a percentage and a
// day-count are never rendered by two different call sites disagreeing on
// precision.
export function formatHeroValue(value: number | string, unit: string): string {
  if (typeof value === 'string') return value;
  switch (unit) {
    case '%':
      return `${value.toFixed(1)}%`;
    case 'Days':
      return `${Math.round(value)}`;
    case 'count':
      return Math.round(value).toLocaleString('en-US');
    default:
      return String(value);
  }
}
