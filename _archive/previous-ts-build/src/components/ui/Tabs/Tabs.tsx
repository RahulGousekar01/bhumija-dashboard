import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  id: string;
  label: string;
  /** Optional count shown after the label. */
  badge?: number | string;
  content: ReactNode;
}

interface TabsProps {
  label: string;
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** "drawer": sticky, padded panel. "page": inline tab bar for page sections. */
  variant?: "drawer" | "page";
}

/**
 * WAI-ARIA tabs with automatic activation: arrow keys move between tabs,
 * Home / End jump to the ends, and only the active tab is in the Tab order.
 */
export function Tabs({ label, tabs, activeId, onChange, variant = "drawer" }: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  const focusTab = (index: number) => {
    const tab = tabs[(index + tabs.length) % tabs.length];
    if (!tab) return;
    onChange(tab.id);
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${tab.id}"]`)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === active?.id);
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = moves[event.key];
    if (next === undefined) return;
    event.preventDefault();
    focusTab(next);
  };

  if (!active) return null;

  return (
    <div className={`${styles.tabs} ${variant === "page" ? styles.page : ""}`}>
      <div ref={listRef} role="tablist" aria-label={label} className={styles.list} onKeyDown={handleKeyDown}>
        {tabs.map((tab) => {
          const selected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              data-tab={tab.id}
              className={styles.tab}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
              {tab.badge !== undefined && <span className={styles.badge}>{tab.badge}</span>}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active.id}`}
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        className={styles.panel}
      >
        {active.content}
      </div>
    </div>
  );
}
