import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../Icon";
import styles from "./SlideOver.module.css";

export interface SlideOverStat {
  label: string;
  value: ReactNode;
}

interface SlideOverNav {
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  description?: string;
  /** Key figures pinned in the header, visible on every tab. */
  stats?: SlideOverStat[];
  /** Previous / next item navigation (also J / K). */
  nav?: SlideOverNav;
  actions?: ReactNode;
  /** Sticky action bar at the bottom of the panel. */
  footer?: ReactNode;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));

/**
 * Right-hand slide-over sheet: 60–70% of the viewport on desktop, full width
 * on mobile, with an expand toggle for wide tables.
 *
 * - Portal + `inert` on the rest of the page, focus trap, focus restore
 * - Escape or backdrop click closes; J / K step through items
 */
export function SlideOver({
  open,
  onClose,
  title,
  eyebrow,
  description,
  stats,
  nav,
  actions,
  footer,
  children,
}: SlideOverProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Keep the latest callbacks without re-running the open/close effect.
  const latest = useRef({ onClose, nav });
  latest.current = { onClose, nav };

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const layer = layerRef.current;
    const panel = panelRef.current;

    const inertSiblings = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element !== layer &&
        !element.hasAttribute("inert") &&
        // Toasts stay live so their actions (Undo) remain usable.
        !element.hasAttribute("data-bh-toasts")
    );
    inertSiblings.forEach((element) => element.setAttribute("inert", ""));
    document.body.classList.add("bh-scroll-locked");

    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        latest.current.onClose();
        return;
      }

      const { nav: currentNav } = latest.current;
      if (currentNav && !isTypingTarget(event.target) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key === "j") currentNav.onNext();
        if (event.key === "k") currentNav.onPrevious();
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      inertSiblings.forEach((element) => element.removeAttribute("inert"));
      document.body.classList.remove("bh-scroll-locked");
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className={styles.layer} ref={layerRef}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        className={`${styles.panel} ${expanded ? styles.expanded : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className={styles.header}>
          <div className={styles.toolbar}>
            {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : <span />}

            <div className={styles.tools}>
              {nav && nav.total > 1 && (
                <div className={styles.nav} role="group" aria-label="Browse items">
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={nav.onPrevious}
                    aria-label="Previous item (K)"
                  >
                    <Icon name="chevronLeft" size={16} />
                  </button>
                  <span className={styles.position} aria-live="polite">
                    {nav.index + 1} of {nav.total}
                  </span>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={nav.onNext}
                    aria-label="Next item (J)"
                  >
                    <Icon name="chevronRight" size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                className={`${styles.iconButton} ${styles.expandButton}`}
                onClick={() => setExpanded((value) => !value)}
                aria-pressed={expanded}
                aria-label={expanded ? "Collapse panel" : "Expand panel"}
              >
                <Icon name={expanded ? "collapse" : "expand"} size={16} />
              </button>

              <button
                type="button"
                className={styles.iconButton}
                onClick={onClose}
                aria-label="Close panel"
                data-autofocus
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          </div>

          <div className={styles.titleRow}>
            <div className={styles.heading}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className={styles.description}>
                  {description}
                </p>
              )}
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </div>

          {stats && stats.length > 0 && (
            <dl className={styles.stats}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <dt>{stat.label}</dt>
                  <dd>{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
