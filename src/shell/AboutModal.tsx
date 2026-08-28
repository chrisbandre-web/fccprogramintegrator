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
        style={{
          // transform: scale(var(--canvas-scale)) — this dialog is
          // portalled to document.body, deliberately outside .canvas-root
          // (canvas.css), so none of the rest of the app's uniform
          // shrink-to-viewport treatment applies to it for free. Every
          // other px value in this app is a CANVAS unit, made
          // proportionally correct only because it lives inside
          // .canvas-root's own transform: scale(). This dialog's
          // maxWidth/padding/font sizes are real, unscaled browser
          // pixels, so at any canvas-scale below 1 (any real viewport
          // narrower than 1920), the dialog looks disproportionately
          // large against the shrunk canvas behind it — at a small
          // enough viewport, large enough to read as "full screen" with
          // no visible backdrop margin. Found live, 28 Aug 2026
          // (Coordinator) — not a regression in this file (one commit
          // total, unchanged since it was built), but a real gap: the
          // only element in the whole app not subject to the scaling
          // system everything else relies on for consistent proportions.
          // Same mechanism as .canvas-root itself (canvas.css), applied
          // here instead of recalculating every dimension by hand.
          transform: 'scale(var(--canvas-scale, 1))',
          background: 'var(--surface)',
          border: '1px solid var(--surface-edge)',
          borderRadius: 8,
          padding: 'var(--space-6)',
          maxWidth: 720,
          maxHeight: '80vh',
          overflowY: 'auto',
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
