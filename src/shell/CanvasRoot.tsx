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
      el.style.setProperty('--canvas-scale', String(scale));
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
