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

// TRUNCATABLE_SELECTOR was previously a broad "any direct child span"
// catch-all, which is how it ended up scanning register-row__trend — a
// span containing TrendGlyph's rotated CSS-border triangle, not text.
// Rotating a shape enlarges its visual (paint) footprint beyond its
// layout box (a 14px shape rotated 45deg has a diagonal extent nearer
// 20px), and scrollWidth picks up on that rotated extent even though
// nothing is actually being clipped or is visually wrong. That's a real,
// deterministic, always-reproducible CSS quirk — not a bug in the
// glyph, and not something scrollWidth/clientWidth can distinguish from
// genuine text overflow. The fix is narrower scope, not a special case:
// only scan elements explicitly marked as truncatable text (.truncate-text,
// applied at each such span in RegisterRow.tsx and ElementTile.tsx),
// never a structural catch-all that can't tell text from a graphical glyph.
// Found from a live console dump, 22 Aug 2026 (Chris).
const TRUNCATABLE_SELECTOR = '.truncate-text';

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
        // Deliberately NOT --status-red/green — those are HealthMark's
        // semantic tokens, and this is a dev-only diagnostic overlay, not
        // product surface. npm run check asserts HealthMark is the ONLY
        // file referencing them (Architect's note, Mark and Glyph, 23 Aug
        // 2026); this line relies on the text itself ("no overruns" vs
        // "N overrun(s)") rather than colour to convey status.
        color: 'var(--ink-primary)',
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
