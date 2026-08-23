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
      const id = owner?.getAttribute('data-element-id') ?? '(unattributed)';
      seen.add(id);
      // Diagnostic — which specific element and selector actually
      // triggered this, since the owner id alone hasn't been enough to
      // find the real cause. Left in deliberately for the next check.
      // eslint-disable-next-line no-console
      console.log('[fit-check overrun]', {
        ownerId: id,
        className: el.className,
        tagName: el.tagName,
        text: el.textContent,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        computedDisplay: getComputedStyle(el).display,
        computedWidth: getComputedStyle(el).width,
      });
    }
  });
  const total = document.querySelectorAll('[data-element-id]').length;
  return { total, overruns: [...seen].sort() };
}

interface ScanResult {
  total: number;
  overruns: string[];
  scanNumber: number; // diagnostic — which of the scheduled scans produced this, so a wrong result is traceable rather than mysterious
  elapsedMs: number;
}

export function OverflowSentinel(): JSX.Element | null {
  const active = isFitCheckActive();
  const { horizon } = useSessionState();
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const mountedAt = performance.now();

    const schedule = (delayMs: number, scanNumber: number) => {
      const t = setTimeout(() => {
        if (!cancelled) {
          const scan = scanForOverruns();
          setResult({ ...scan, scanNumber, elapsedMs: Math.round(performance.now() - mountedAt) });
        }
      }, delayMs);
      timers.push(t);
    };

    document.fonts.ready.then(() => {
      if (cancelled) return;
      [0, 150, 400, 800, 1500].forEach((delay, i) => schedule(delay, i + 1));
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
    let firstCallback = true; // ResizeObserver.observe() always fires once immediately with the current size, even though nothing has resized — that mandatory initial callback is not a real resize and must not overwrite the settled scan above with an early, likely-unsettled one.
    const ro = new ResizeObserver(() => {
      if (firstCallback) {
        firstCallback = false;
        return;
      }
      const scan = scanForOverruns();
      setResult({ ...scan, scanNumber: -1, elapsedMs: -1 });
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [active]);

  if (!active || !result) return null;

  const line =
    result.overruns.length === 0
      ? `fit check: ${result.total} elements, no overruns [scan ${result.scanNumber}, ${result.elapsedMs}ms]`
      : `fit check: ${result.total} elements, ${result.overruns.length} overrun(s): ${result.overruns.join(', ')} [scan ${result.scanNumber}, ${result.elapsedMs}ms]`;

  return (
    <div
      role="status"
      onClick={() => {
        const scan = scanForOverruns();
        setResult({ ...scan, scanNumber: 0, elapsedMs: -1 }); // scan 0 = manual, click-triggered
      }}
      title="Click to re-scan immediately"
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
        cursor: 'pointer',
        zIndex: 100,
      }}
    >
      {line}
    </div>
  );
}
