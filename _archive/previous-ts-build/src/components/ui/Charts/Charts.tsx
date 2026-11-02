import type { ReactNode } from "react";
import type { CountBreakdown, GradeBand } from "../../../types/dashboard";
import { formatMT, formatNumber, formatPercent, percentOf } from "../../../lib/format";
import styles from "./Charts.module.css";

/*
 * Charts are plain HTML lists: every value is real text in reading order,
 * so screen readers get the data without a separate table. Bars are
 * decorative and hidden from assistive tech.
 */

interface GradeChartProps {
  title: string;
  total: number;
  grades: GradeBand[];
  /** "bars" = horizontal share-of-total rows, "columns" = vertical quantity columns. */
  variant?: "bars" | "columns";
}

export function GradeChart({ title, total, grades, variant = "bars" }: GradeChartProps) {
  const maxQuantity = Math.max(...grades.map((grade) => grade.quantity), 1);

  return (
    <figure className={styles.chartCard}>
      <figcaption className={styles.chartHeader}>
        <span className={styles.chartTitle}>{title}</span>
        <span className={styles.chartTotal}>{formatMT(total)}</span>
      </figcaption>

      {grades.length === 0 ? (
        <p className={styles.empty}>No grade data</p>
      ) : variant === "columns" ? (
        <ol className={styles.columns} aria-label={`${title} quantity by grade`}>
          {grades.map((grade) => {
            const share = percentOf(grade.quantity, total);
            const height = Math.max((grade.quantity / maxQuantity) * 100, 4);

            return (
              <li className={styles.column} key={grade.range}>
                <span className={styles.columnValue}>{formatNumber(grade.quantity)}</span>
                <span className={styles.columnArea} aria-hidden="true">
                  <span className={styles.columnBar} style={{ height: `${height}%` }} />
                </span>
                <span className={styles.columnLabel}>{grade.range}</span>
                <span className={styles.columnShare}>{formatPercent(share, 1)}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className={styles.bars} aria-label={`${title} quantity by grade`}>
          {grades.map((grade) => {
            const share = percentOf(grade.quantity, total);

            return (
              <li className={styles.barRow} key={grade.range}>
                <span className={styles.barLabel}>{grade.range}</span>
                <span className={styles.track} aria-hidden="true">
                  <span className={styles.fill} style={{ width: `${Math.min(share, 100)}%` }} />
                </span>
                <span className={styles.barValue}>
                  <strong>{formatMT(grade.quantity)}</strong>
                  <span>{formatPercent(share, 1)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </figure>
  );
}

interface BreakdownListProps {
  title?: string;
  subtitle?: string;
  items: CountBreakdown[];
  total: number;
  totalLabel?: string;
  tone?: "brand" | "critical";
  children?: ReactNode;
}

/** Labelled counts with their share of a total, plus a total row. */
export function BreakdownList({
  title,
  subtitle,
  items,
  total,
  totalLabel = "Total",
  tone = "brand",
  children,
}: BreakdownListProps) {
  return (
    <div className={styles.breakdown}>
      {title && (
        <div className={styles.breakdownHeader}>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      )}

      {children}

      <ul className={styles.breakdownList}>
        {items.map((item) => {
          const share = percentOf(item.count, total);

          return (
            <li className={styles.breakdownItem} key={item.label}>
              <span className={styles.breakdownTop}>
                <span>{item.label}</span>
                <span className={styles.breakdownFigures}>
                  <strong>{formatNumber(item.count)}</strong>
                  <span>{formatPercent(share)}</span>
                </span>
              </span>
              <span className={styles.track} aria-hidden="true">
                <span
                  className={`${styles.fill} ${tone === "critical" ? styles.fillCritical : ""}`}
                  style={{ width: `${Math.min(share, 100)}%` }}
                />
              </span>
            </li>
          );
        })}
      </ul>

      <div className={styles.breakdownTotal}>
        <span>{totalLabel}</span>
        <strong>{formatNumber(total)}</strong>
      </div>
    </div>
  );
}
