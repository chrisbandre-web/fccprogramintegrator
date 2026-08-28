import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ABOUT_HEADING, ABOUT_PARAGRAPHS } from './about.ts';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// TAD §D.5.12 — "the only focus trap in the build." Focus moves in on open
// and is trapped; closes on the dismiss control, on click outside, and on
// Escape; focus returns to the affordance. This is the one place in the
// build that departs from pure DOM-order tab flow (§L.4.8), and it departs
// explicitly, not by omission.
export function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }): JSX.Element | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const node = dialogRef.current;
      if (!node) return;
      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null,
      );
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !node.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(26, 26, 26, 0.4)',
        zIndex: 10,
        transition: 'opacity var(--motion-reveal)',
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ABOUT_HEADING}
        tabIndex={-1}
        className="about-modal-scroll"
        style={{
          // transform: scale(max(var(--canvas-scale), FLOOR)) — a floor,
          // not a straight multiplier. Confirmed 28 Aug 2026 (Coordinator,
          // Samsung Note 10+): a real mobile canvas-scale is small enough
          // (~0.21 at a 412px-wide viewport) that the modal's body text
          // would render at roughly 4px following canvas-scale exactly --
          // a genuine readability failure, not a preference. There's no
          // requirement forcing this dialog to track canvas-scale 1:1;
          // it's already the one architecturally distinct overlay in the
          // build (the sole focus trap, §D.5.12), and nothing else needs
          // to visually align WITH it the way elements within the
          // dashboard need to align with each other. 0.4 is chosen to
          // land close to the requested "roughly double" at that specific
          // device's real scale (0.2146 -> 0.4292 would be exact double;
          // 0.4 is a clean, slightly more conservative round number) --
          // a genuine judgement call, not a measured optimum, since I
          // have no way to see this rendered myself. A floor rather than
          // a flat 2x multiplier specifically because it's self-limiting:
          // inert at any canvas-scale already at or above 0.4 (ordinary
          // desktop use), so it can't accidentally oversize the modal on
          // a normal browser window the way a multiplier applied
          // unconditionally could.
          transform: 'scale(max(var(--canvas-scale, 1), 0.4))',
          background: 'var(--surface)',
          border: '1px solid var(--surface-edge)',
          borderRadius: 8,
          padding: 'var(--space-6)',
          maxWidth: 720,
          maxHeight: '80vh',
          font: 'var(--weight-regular) var(--type-body) / var(--leading-body) var(--font-family)',
          color: 'var(--ink-primary)',
          outline: 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            font: 'var(--weight-semibold) var(--type-modal-heading) / var(--leading-tight) var(--font-family)',
            margin: '0 0 var(--space-4) 0',
          }}
        >
          {ABOUT_HEADING}
        </h2>
        {ABOUT_PARAGRAPHS.map((p, i) => (
          <p key={i} style={{ margin: '0 0 var(--space-4) 0' }}>
            {p}
          </p>
        ))}
        <button type="button" onClick={onClose} style={{ cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
