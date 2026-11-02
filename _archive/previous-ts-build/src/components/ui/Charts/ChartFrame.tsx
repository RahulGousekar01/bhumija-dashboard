import { useId, type ReactNode } from "react";
import styles from "./ChartFrame.module.css";

interface ChartFrameProps {
  title: string;
  subtitle?: string;
  /** Controls shown at the top right (e.g. a segmented toggle). */
  actions?: ReactNode;
  /**
   * The chart's data as a table for screen readers. The drawn chart itself is
   * hidden from assistive tech, so every chart must pass this.
   */
  table: { columns: string[]; rows: (string | number)[][] };
  /** Visible content below the chart (legend, notes). */
  footer?: ReactNode;
  height?: number;
  children: ReactNode;
  className?: string;
}

/** Card wrapper for a Recharts chart, with an accessible data table. */
export function ChartFrame({
  title,
  subtitle,
  actions,
  table,
  footer,
  height = 260,
  children,
  className,
}: ChartFrameProps) {
  const titleId = useId();

  return (
    <figure className={`${styles.frame} ${className ?? ""}`} aria-labelledby={titleId}>
      <div className={styles.header}>
        <figcaption>
          <span id={titleId} className={styles.title}>
            {title}
          </span>
          {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        </figcaption>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>

      {/* Grows to fill a stretched card; `height` is the minimum. */}
      <div className={styles.chart} style={{ minHeight: height }} aria-hidden="true">
        {children}
      </div>

      <table className="bh-sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            {table.columns.map((column) => (
              <th key={column} scope="col">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {footer}
    </figure>
  );
}
