import type { ReactNode } from "react";
import { Icon } from "../Icon";
import styles from "./StatCard.module.css";

export type Tone = "neutral" | "brand" | "critical" | "warning" | "info" | "success";

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[`badge-${tone}`]}`}>{children}</span>;
}

interface StatCardProps {
  title: string;
  value: ReactNode;
  caption?: ReactNode;
  badge?: ReactNode;
  /** Visual emphasis; "highlight" is used for aggregate, view-only totals. */
  variant?: "default" | "highlight" | "critical";
  /** When set, the whole card is a button that opens a detail view. */
  onOpen?: () => void;
  children?: ReactNode;
}

/**
 * KPI card. Interactive cards are a single native <button> so the whole
 * surface is the hit target and the accessible name is the card's text.
 */
export function StatCard({
  title,
  value,
  caption,
  badge,
  variant = "default",
  onOpen,
  children,
}: StatCardProps) {
  const className = [styles.card, styles[variant], onOpen ? styles.interactive : ""]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className={styles.top}>
        <span className={styles.title}>{title}</span>
        <span className={styles.meta}>
          {badge}
          {onOpen && (
            <span className={styles.openIcon}>
              <Icon name="arrowUpRight" size={16} />
            </span>
          )}
        </span>
      </span>
      <span className={styles.value}>{value}</span>
      {caption && <span className={styles.caption}>{caption}</span>}
      {children && <span className={styles.extra}>{children}</span>}
    </>
  );

  if (!onOpen) return <div className={className}>{content}</div>;

  return (
    <button type="button" className={className} onClick={onOpen} aria-haspopup="dialog">
      {content}
    </button>
  );
}

interface MetricTileProps {
  label: string;
  value: ReactNode;
  caption?: ReactNode;
}

/** Compact figure used inside detail drawers. */
export function MetricTile({ label, value, caption }: MetricTileProps) {
  return (
    <div className={styles.tile}>
      <span className={styles.tileLabel}>{label}</span>
      <strong className={styles.tileValue}>{value}</strong>
      {caption && <span className={styles.tileCaption}>{caption}</span>}
    </div>
  );
}

export function TileGrid({ children }: { children: ReactNode }) {
  return <div className={styles.tileGrid}>{children}</div>;
}

interface KeyValueListProps {
  items: { label: ReactNode; value: ReactNode; hint?: ReactNode }[];
  /**
   * Render with <span>s instead of a <dl>. Needed inside an interactive
   * StatCard, because a <button> may only contain phrasing content.
   */
  inline?: boolean;
}

/** Two-column label/value rows, rendered as a description list. */
export function KeyValueList({ items, inline = false }: KeyValueListProps) {
  const [List, Row, Term, Detail] = inline
    ? (["span", "span", "span", "span"] as const)
    : (["dl", "div", "dt", "dd"] as const);

  return (
    <List className={styles.kvList}>
      {items.map((item, index) => (
        <Row className={styles.kvRow} key={index}>
          <Term className={styles.kvTerm}>
            {item.label}
            {item.hint && <span className={styles.kvHint}>{item.hint}</span>}
          </Term>
          <Detail className={styles.kvValue}>{item.value}</Detail>
        </Row>
      ))}
    </List>
  );
}
