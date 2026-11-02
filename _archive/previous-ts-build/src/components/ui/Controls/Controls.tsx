import { useId, type ReactNode } from "react";
import styles from "./Controls.module.css";

interface SegmentedControlProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Single-choice toggle group. Each option is a button with aria-pressed. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div className={styles.segmented} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={styles.segment}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onChange: (value: string) => void;
  wide?: boolean;
}

export function SelectField({ label, value, options, onChange, wide }: SelectFieldProps) {
  const id = useId();

  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ""}`}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
      </label>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  numeric?: boolean;
}

interface DataTableProps<T> {
  caption: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Optional summary row rendered in <tfoot>. */
  footer?: ReactNode[];
}

export function DataTable<T>({ caption, columns, rows, rowKey, footer }: DataTableProps<T>) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" className={column.numeric ? styles.numeric : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column, index) =>
                index === 0 ? (
                  <th key={column.header} scope="row">
                    {column.cell(row)}
                  </th>
                ) : (
                  <td key={column.header} className={column.numeric ? styles.numeric : undefined}>
                    {column.cell(row)}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
        {footer && (
          <tfoot>
            <tr>
              {footer.map((cell, index) =>
                index === 0 ? (
                  <th key={index} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={index} className={columns[index]?.numeric ? styles.numeric : undefined}>
                    {cell}
                  </td>
                )
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <div className={styles.callout}>{children}</div>;
}
