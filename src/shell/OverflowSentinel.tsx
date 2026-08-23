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
  '.register-row__metric > span', // the truncating inner span, not the centering outer flex box
  '.register-row__title',
  '[data-element-id] > span:not(.register-row__metric)', // exclude the outer metric box — it's covered above, and it's a direct child too, so this catch-all would otherwise measure the wrong (non-truncating) element
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
    const timers: ReturnType<typeof setTimeout>[] = [];

    // A single scan, however carefully timed, is a race — document.fonts
    // .ready resolving doesn't guarantee the LAST layout-affecting reflow
    // has already happened (confirmed live, 22 Aug 2026: elements measured
    // as genuinely fitting via DevTools moments after load were still
    // being reported as overruns by a scan that had run too early and
    // never re-checked). Rather than guess at a longer fixed delay — which
    // just relocates the same race rather than removing it — scan
    // repeatedly over a settling window and keep only the last result,
    // which reflects whatever the page has actually settled into.
    const schedule = (delayMs: number) => {
      const t = setTimeout(() => {
        if (!cancelled) setResult(scanForOverruns());
      }, delayMs);
      timers.push(t);
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      [0, 150, 400, 800, 1500].forEach(schedule);
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
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
