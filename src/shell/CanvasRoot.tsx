import { useEffect, useRef, type ReactNode } from 'react';
import '../design/canvas.css';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// TAD §D.5.3 — CanvasRoot holds the fixed 1920×1080 box and keeps
// --canvas-scale correct: min(vw / 1920, vh / 1080), set once on mount and
// updated on resize.
export function CanvasRoot({ children }: { children: ReactNode }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const applyScale = () => {
      const scale = Math.min(window.innerWidth / CANVAS_WIDTH, window.innerHeight / CANVAS_HEIGHT);
      // Set on document.documentElement, not the local .canvas-root ref.
      // CSS custom properties only cascade DOWN the DOM tree from where
      // they're set — setting it on .canvas-root itself made it
      // invisible to anything outside .canvas-root's own subtree,
      // including the About modal (AboutModal.tsx), which deliberately
      // portals to document.body — a sibling branch, not a descendant of
      // .canvas-root. canvas.css's own transform: scale(var(--canvas-
      // scale, 1)) still resolves correctly either way, since
      // .canvas-root is itself a descendant of <html> and inherits
      // normally; this change only widens who else can see the value,
      // it doesn't change what .canvas-root itself receives. Found live,
      // 28 Aug 2026 (Coordinator) — the About modal was rendering at
      // real, unscaled pixel dimensions against an otherwise-shrunk
      // canvas, disproportionately large at any viewport narrower than
      // 1920.
      document.documentElement.style.setProperty('--canvas-scale', String(scale));
    };

    applyScale();
    window.addEventListener('resize', applyScale);
    return () => window.removeEventListener('resize', applyScale);
  }, []);

  return (
    <div className="canvas-viewport">
      <div className="canvas-root" ref={ref}>
        {children}
      </div>
    </div>
  );
}
