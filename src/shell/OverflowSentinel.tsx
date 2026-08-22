import { useEffect, useState } from 'react';
import { useSessionState } from './SessionStateProvider.tsx';

// TAD §J.1 exit: "open .../?fit-check=1 ... confirm the line reads
// 'fit check: 26 elements, no overruns'." Renders nothing whatsoever when
// inactive — no banner, no wrapper, no attribute, no console output — so
// this component has zero footprint on the board anyone else ever sees.
// Runs after mount and after every horizon change, and on resize (a
// horizon change swaps in different text at different lengths, so a
// truncation that doesn't exist at Month can appear at Quarter or Year).
function isFitCheckActive(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('fit-check') === '1';
}

const TRUNCATABLE_SELECTOR = [
  '.register-row__source',
  '.register-row__metric',
  '.register-row__title',
  '[data-element-id] > span',
].join(',');

function scanForOverruns(): { total: number; overruns: string[] } {
  const seen = new Set<string>();
  document.querySelectorAll<HTMLElement>(TRUNCATABLE_SELECTOR).forEach((el) => {
    if (el.scrollWidth > el.clientWidth + 1) {
      const owner = el.closest<HTMLElement>('[data-element-id]');
      seen.add(owner?.getAttribute('data-element-id') ?? '(unattributed)');
    }
  });
  const total = document.querySelectorAll('[data-element-id]').length;
  return { total, overruns: [...seen].sort() };
}

export function OverflowSentinel(): JSX.Element | null {
  const active = isFitCheckActive();
  const { horizon } = useSessionState();
  const [result, setResult] = useState<{ total: number; overruns: string[] } | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    // Wait for the actual web font, not just a paint frame. fcc-tokens.css
    // deliberately uses font-display: block, so text is measured against a
    // FALLBACK font's metrics until Inter finishes loading and swaps in —
    // scanning before that point measures the wrong font entirely, which
    // produces exactly the false positives found here (identical-length
    // strings getting different verdicts, short strings with no visible
    // ellipsis still flagged). document.fonts.ready resolves once the real
    // font is available; only then is scrollWidth/clientWidth trustworthy.
    document.fonts.ready
      .then(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())))
      .then(() => {
        if (!cancelled) setResult(scanForOverruns());
      });
    return () => {
      cancelled = true;
    };
  }, [active, horizon]);

  useEffect(() => {
    if (!active) return;
    const root = document.querySelector('.canvas-root');
    if (!root) return;
    const ro = new ResizeObserver(() => setResult(scanForOverruns()));
    ro.observe(root);
    return () => ro.disconnect();
  }, [active]);

  if (!active || !result) return null;

  const line =
    result.overruns.length === 0
      ? `fit check: ${result.total} elements, no overruns`
      : `fit check: ${result.total} elements, ${result.overruns.length} overrun(s): ${result.overruns.join(', ')}`;

  return (
    <div
      role="status"
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '4px 8px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--surface-edge)',
        color: result.overruns.length === 0 ? 'var(--status-green)' : 'var(--status-red)',
        fontWeight: 'var(--weight-semibold)',
        font: '12px monospace',
        zIndex: 100,
      }}
    >
      {line}
    </div>
  );
}
