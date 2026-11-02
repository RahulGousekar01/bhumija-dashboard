import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/ui";
import { STATUS_ORDER } from "../../config/statusPalette";
import { useDashboard } from "../../context/DashboardContext";
import { formatDate } from "../../lib/dates";
import { formatCurrency, formatNumber } from "../../lib/format";
import type { RegisterRecord, WorkflowStatus } from "../../types/governance";
import { SEVERITY_LABEL } from "./OverviewPanels";
import {
  QUEUE_ORDER,
  QUEUE_SLA,
  RECORD_TYPES,
  applyRegisterFilter,
  hasOpenDiscrepancy,
  isOverSla,
  type RegisterFilter,
} from "./registerFilters";
import styles from "./grid.module.css";

const column = createColumnHelper<RegisterRecord>();

/* ---------- Cells shared with the drawer ---------- */

export function StatusChip({ status }: { status: WorkflowStatus }) {
  const { statusColors } = useDashboard();
  const color = statusColors[status];
  return (
    <span className={styles.statusChip} style={{ background: color.bg, color: color.fg }}>
      <span className={styles.statusDot} style={{ background: color.solid }} aria-hidden="true" />
      {status}
    </span>
  );
}

export function ReconTag({ record }: { record: RegisterRecord }) {
  const { recon } = record;
  if (recon.state === "provisional") {
    return (
      <span className={`${styles.recon} ${styles.reconProvisional}`} title={`Awaiting ${recon.pendingSource}`}>
        <Icon name="clock" size={12} /> Provisional
      </span>
    );
  }
  if (recon.state === "variance") {
    return (
      <span className={`${styles.recon} ${styles.reconVariance}`}>
        <Icon name="alert" size={12} /> Δ {recon.variancePct}%
      </span>
    );
  }
  return (
    <span className={`${styles.recon} ${styles.reconOk}`}>
      <Icon name="check" size={12} /> Reconciled
    </span>
  );
}

/* ---------- Grid ---------- */

interface RegisterGridProps {
  records: RegisterRecord[];
  filter: RegisterFilter;
  onFilterChange: (next: Partial<RegisterFilter>) => void;
  selectedId: string | null;
  onOpen: (id: string) => void;
  /** Filtered, sorted order, so the drawer can step through it. */
  onVisibleChange: (ids: string[]) => void;
  onExport: (records: RegisterRecord[], format: "PDF" | "Excel") => void;
}

export function RegisterGrid({
  records,
  filter,
  onFilterChange,
  selectedId,
  onOpen,
  onVisibleChange,
  onExport,
}: RegisterGridProps) {
  const isQueue = filter.tab === "queue";
  const [sorting, setSorting] = useState<SortingState>(isQueue ? [{ id: "age", desc: true }] : []);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setSorting(isQueue ? [{ id: "age", desc: true }] : [{ id: "date", desc: true }]);
  }, [isQueue]);

  const filtered = useMemo(() => applyRegisterFilter(records, filter), [records, filter]);

  /* Counts for the chips ignore the chip's own dimension. */
  const typeCounts = useMemo(() => {
    const base = applyRegisterFilter(records, { ...filter, type: "all", subtype: null });
    const counts = new Map<string, number>();
    base.forEach((record) => counts.set(record.type, (counts.get(record.type) ?? 0) + 1));
    return { total: base.length, counts };
  }, [records, filter]);

  const statusCounts = useMemo(() => {
    const base = applyRegisterFilter(records, { ...filter, statuses: [] });
    const counts = new Map<WorkflowStatus, number>();
    base.forEach((record) => counts.set(record.status, (counts.get(record.status) ?? 0) + 1));
    return counts;
  }, [records, filter]);

  const queueCounts = useMemo(() => {
    const base = applyRegisterFilter(records, { ...filter, queue: null });
    const counts = new Map<string, number>();
    base.forEach((record) => record.queues.forEach((queue) => counts.set(queue, (counts.get(queue) ?? 0) + 1)));
    return { total: base.length, counts };
  }, [records, filter]);

  const columns = useMemo(
    () => [
      column.accessor("refNo", {
        header: "Reference",
        cell: (info) => (
          <button
            type="button"
            className={styles.refButton}
            onClick={() => onOpen(info.row.original.id)}
            aria-haspopup="dialog"
          >
            <span className={styles.refNo}>{info.getValue()}</span>
            <span className={styles.subtle}>{info.row.original.subtype}</span>
          </button>
        ),
      }),
      column.accessor("party", { header: "Party" }),
      column.accessor((record) => `${record.taluka} ${record.location}`, {
        id: "jurisdiction",
        header: "Jurisdiction",
        cell: (info) => (
          <span className={styles.stack}>
            <span>{info.row.original.taluka}</span>
            <span className={styles.subtle}>
              {info.row.original.location} · {info.row.original.district}
            </span>
          </span>
        ),
      }),
      column.accessor("quantity", {
        header: "Qty (MT)",
        cell: (info) => formatNumber(info.getValue()),
        meta: { numeric: true },
      }),
      column.accessor("amount", {
        header: "Value (₹)",
        cell: (info) => formatCurrency(info.getValue()).replace("₹", ""),
        meta: { numeric: true },
      }),
      column.accessor("date", { header: "Date", cell: (info) => formatDate(info.getValue()) }),
      column.accessor("ageDays", {
        id: "age",
        header: "Age",
        cell: (info) => {
          const record = info.row.original;
          const over = isOverSla(record);
          return (
            <span className={over ? styles.ageOver : undefined}>
              {info.getValue()} d{over && <span className="bh-sr-only"> (past SLA)</span>}
            </span>
          );
        },
        meta: { numeric: true },
      }),
      column.accessor((record) => record.recon.variancePct + (record.recon.state === "provisional" ? 100 : 0), {
        id: "recon",
        header: "Reconciliation",
        cell: (info) => <ReconTag record={info.row.original} />,
      }),
      column.accessor("status", {
        header: "Status",
        cell: (info) => <StatusChip status={info.getValue()} />,
        sortingFn: (a, b) => STATUS_ORDER.indexOf(a.original.status) - STATUS_ORDER.indexOf(b.original.status),
      }),
      column.accessor((record) => record.discrepancies.filter((item) => item.status === "Open" || item.status === "Under review").length, {
        id: "flags",
        header: "Flags",
        cell: (info) => {
          const open = info.row.original.discrepancies.filter((item) => item.status === "Open" || item.status === "Under review");
          if (open.length === 0) return <span className={styles.subtle}>—</span>;
          const worst = open.some((item) => item.severity === "high") ? "high" : open.some((item) => item.severity === "medium") ? "medium" : "low";
          return (
            <span className={`${styles.flag} ${styles[`flag-${worst}`]}`}>
              <Icon name="flag" size={11} />
              {open.length}
              <span className="bh-sr-only"> open, {SEVERITY_LABEL[worst]} severity</span>
            </span>
          );
        },
        meta: { numeric: true },
      }),
      column.accessor((record) => (record.reviewed ? 1 : 0), {
        id: "reviewed",
        header: "Reviewed",
        cell: (info) =>
          info.row.original.reviewed ? (
            <span className={styles.reviewed} title={`${info.row.original.reviewed.by}, ${info.row.original.reviewed.designation}`}>
              <Icon name="check" size={12} /> Yes
            </span>
          ) : (
            <span className={styles.subtle}>—</span>
          ),
      }),
    ],
    [onOpen]
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (record) => record.id,
    initialState: { pagination: { pageSize: 15 } },
    autoResetPageIndex: true,
  });

  useEffect(() => table.setPageSize(pageSize), [pageSize, table]);

  // Report the full sorted order (all pages) for drawer navigation.
  const sortedIds = table.getSortedRowModel().rows.map((row) => row.id);
  const orderKey = sortedIds.join("|");
  useEffect(() => {
    onVisibleChange(orderKey ? orderKey.split("|") : []);
  }, [orderKey, onVisibleChange]);

  const rows = table.getRowModel().rows;
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();
  const toggleStatus = (status: WorkflowStatus) =>
    onFilterChange({
      statuses: filter.statuses.includes(status)
        ? filter.statuses.filter((item) => item !== status)
        : [...filter.statuses, status],
    });

  const activeChips: { key: string; label: string; clear: Partial<RegisterFilter> }[] = [];
  if (filter.subtype) activeChips.push({ key: "subtype", label: filter.subtype, clear: { subtype: null } });
  if (filter.queue && !isQueue) activeChips.push({ key: "queue", label: `Queue: ${filter.queue}`, clear: { queue: null } });

  return (
    <div className={styles.grid}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <Icon name="search" size={14} />
          <input
            type="search"
            placeholder="Search ref no, party, vehicle, location…"
            aria-label="Search the register"
            value={filter.search}
            onChange={(event) => onFilterChange({ search: event.target.value })}
          />
        </div>

        <div className={styles.toggles}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={filter.discrepanciesOnly}
              onChange={(event) => onFilterChange({ discrepanciesOnly: event.target.checked })}
            />
            With discrepancies
          </label>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={filter.provisionalOnly}
              onChange={(event) => onFilterChange({ provisionalOnly: event.target.checked })}
            />
            Provisional only
          </label>
        </div>

        <div className={styles.exports}>
          <button type="button" onClick={() => onExport(table.getSortedRowModel().rows.map((row) => row.original), "Excel")}>
            <Icon name="download" size={14} /> Excel
          </button>
          <button type="button" onClick={() => onExport(table.getSortedRowModel().rows.map((row) => row.original), "PDF")}>
            <Icon name="download" size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Quick filter chips */}
      <div className={styles.chipRows}>
        {isQueue ? (
          <div className={styles.chipGroup} role="group" aria-label="Filter by queue">
            <button type="button" aria-pressed={!filter.queue} onClick={() => onFilterChange({ queue: null })}>
              All open <span className={styles.count}>{queueCounts.total}</span>
            </button>
            {QUEUE_ORDER.filter((queue) => queueCounts.counts.get(queue) || filter.queue === queue).map((queue) => (
              <button
                key={queue}
                type="button"
                aria-pressed={filter.queue === queue}
                onClick={() => onFilterChange({ queue: filter.queue === queue ? null : queue })}
              >
                {queue} <span className={styles.count}>{queueCounts.counts.get(queue) ?? 0}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className={styles.chipGroup} role="group" aria-label="Filter by record type">
            <button type="button" aria-pressed={filter.type === "all"} onClick={() => onFilterChange({ type: "all", subtype: null })}>
              All records <span className={styles.count}>{typeCounts.total}</span>
            </button>
            {RECORD_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                aria-pressed={filter.type === type.value}
                onClick={() => onFilterChange({ type: filter.type === type.value ? "all" : type.value, subtype: null })}
              >
                {type.label} <span className={styles.count}>{typeCounts.counts.get(type.value) ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        <div className={styles.statusChips} role="group" aria-label="Filter by status">
          {STATUS_ORDER.filter((status) => statusCounts.has(status) || filter.statuses.includes(status)).map((status) => (
            <StatusToggle
              key={status}
              status={status}
              count={statusCounts.get(status) ?? 0}
              pressed={filter.statuses.includes(status)}
              onToggle={() => toggleStatus(status)}
            />
          ))}
          {activeChips.map((chip) => (
            <span key={chip.key} className={styles.activeChip}>
              {chip.label}
              <button type="button" onClick={() => onFilterChange(chip.clear)} aria-label={`Remove filter ${chip.label}`}>
                <Icon name="close" size={12} />
              </button>
            </span>
          ))}
        </div>
      </div>

      <p className={styles.resultLine} aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "record" : "records"}
        {isQueue ? " awaiting action" : " in the period and open items"} · sorted by{" "}
        {sorting[0] ? `${sorting[0].id} (${sorting[0].desc ? "high to low" : "low to high"})` : "default order"}
      </p>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="check" size={20} />
          <p>{isQueue ? "Nothing awaiting action for these filters." : "No records match these filters."}</p>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="bh-sr-only">
              {isQueue ? "Review queue" : "Register"}. Column headers sort the table; select a reference to open its
              details.
            </caption>
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    const numeric = (header.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric;
                    return (
                      <th
                        key={header.id}
                        scope="col"
                        className={numeric ? styles.numCell : undefined}
                        aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      >
                        <button type="button" className={styles.sortButton} onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <Icon name={sorted === "asc" ? "arrowUp" : sorted === "desc" ? "arrowDown" : "sort"} size={11} />
                        </button>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={[
                    row.id === selectedId ? styles.selectedRow : "",
                    hasOpenDiscrepancy(row.original) ? styles.flaggedRow : "",
                  ].join(" ")}
                  // Whole-row click for mouse users; the reference button is the keyboard target.
                  onClick={(event) => {
                    if (!(event.target as HTMLElement).closest("button, a, input")) onOpen(row.id);
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const numeric = (cell.column.columnDef.meta as { numeric?: boolean } | undefined)?.numeric;
                    return (
                      <td key={cell.id} className={numeric ? styles.numCell : undefined}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 && (
        <nav className={styles.pager} aria-label="Register pages">
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <div>
            <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
              <Icon name="chevronLeft" size={14} />
            </button>
            <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
              <Icon name="chevronRight" size={14} />
            </button>
          </div>
          <label>
            Rows
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {[15, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </nav>
      )}

      {isQueue && (
        <p className={styles.slaNote}>
          SLA: {Object.entries(QUEUE_SLA)
            .filter(([queue]) => queue !== "Expiring permits")
            .map(([queue, days]) => `${queue} ${days} d`)
            .join(" · ")}
          . Ages past SLA are shown in red.
        </p>
      )}
    </div>
  );
}

function StatusToggle({
  status,
  count,
  pressed,
  onToggle,
}: {
  status: WorkflowStatus;
  count: number;
  pressed: boolean;
  onToggle: () => void;
}) {
  const { statusColors } = useDashboard();
  const color = statusColors[status];
  return (
    <button
      type="button"
      className={styles.statusToggle}
      aria-pressed={pressed}
      onClick={onToggle}
      style={pressed ? { background: color.bg, color: color.fg, borderColor: color.solid } : undefined}
    >
      <span className={styles.statusDot} style={{ background: color.solid }} aria-hidden="true" />
      {status}
      <span className={styles.count}>{count}</span>
    </button>
  );
}
