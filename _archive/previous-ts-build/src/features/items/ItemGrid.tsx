import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { forwardRef, useEffect, useMemo, useState } from "react";
import { Icon, Sparkline } from "../../components/ui";
import { useDashboard } from "../../context/DashboardContext";
import { formatPercent } from "../../lib/format";
import { MODULES, moduleLabel, type DashboardItem, type ModuleKey } from "./buildItems";
import styles from "./ItemGrid.module.css";

type ViewMode = "cards" | "table";

const VIEW_STORAGE_KEY = "bh-dashboard-grid-view";

const readViewMode = (): ViewMode => {
  try {
    return window.localStorage.getItem(VIEW_STORAGE_KEY) === "table" ? "table" : "cards";
  } catch {
    return "cards";
  }
};

const columnHelper = createColumnHelper<DashboardItem>();

interface ItemGridProps {
  items: DashboardItem[];
  module: ModuleKey | "all";
  onModuleChange: (module: ModuleKey | "all") => void;
  selectedId: string | null;
  onOpen: (id: string) => void;
  /** Reports the filtered, sorted order so the drawer can step through it. */
  onVisibleChange: (ids: string[]) => void;
}

export const ItemGrid = forwardRef<HTMLElement, ItemGridProps>(function ItemGrid(
  { items, module, onModuleChange, selectedId, onOpen, onVisibleChange },
  ref
) {
  const { crossFilter, clearCrossFilter } = useDashboard();
  const [view, setView] = useState<ViewMode>(readViewMode);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const changeView = (next: ViewMode) => {
    setView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Storage unavailable (private mode); the choice just isn't remembered.
    }
  };

  /* Cross-filter and search apply first, so module counts reflect them. */
  const narrowed = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(
      (item) =>
        (!crossFilter || item.tags.includes(crossFilter.tag)) &&
        (!query ||
          `${item.title} ${moduleLabel(item.module)} ${item.metric} ${item.status.label}`.toLowerCase().includes(query))
    );
  }, [items, crossFilter, search]);

  const visible = useMemo(
    () => (module === "all" ? narrowed : narrowed.filter((item) => item.module === module)),
    [narrowed, module]
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: "Item",
        cell: (info) => (
          <button
            type="button"
            className={styles.rowButton}
            onClick={() => onOpen(info.row.original.id)}
            aria-haspopup="dialog"
          >
            <span className={styles.rowTitle}>{info.getValue()}</span>
            <span className={styles.rowModule}>{moduleLabel(info.row.original.module)}</span>
          </button>
        ),
      }),
      columnHelper.accessor("value", {
        header: "Value",
        cell: (info) => <strong className={styles.num}>{info.row.original.display}</strong>,
        meta: { numeric: true },
      }),
      columnHelper.accessor("metric", { header: "Key metric", enableSorting: false }),
      columnHelper.accessor((item) => item.progress?.value ?? -1, {
        id: "progress",
        header: "Progress",
        cell: (info) => {
          const progress = info.row.original.progress;
          return progress ? <ProgressBar label={progress.label} value={progress.value} /> : "—";
        },
      }),
      columnHelper.accessor((item) => item.status.label, {
        id: "status",
        header: "Status",
        cell: (info) => <StatusPill status={info.row.original.status} />,
      }),
      columnHelper.display({
        id: "trend",
        header: "Trend",
        cell: (info) => <Sparkline data={info.row.original.trend} width={88} height={24} />,
      }),
    ],
    [onOpen]
  );

  const table = useReactTable({
    data: visible,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (item) => item.id,
  });

  const rows = table.getRowModel().rows;
  const orderKey = rows.map((row) => row.id).join("|");

  useEffect(() => {
    onVisibleChange(orderKey ? orderKey.split("|") : []);
  }, [orderKey, onVisibleChange]);

  const sortOptions = [
    { value: "", label: "Default order" },
    { value: "value:desc", label: "Value: high to low" },
    { value: "value:asc", label: "Value: low to high" },
    { value: "title:asc", label: "Name: A to Z" },
    { value: "progress:desc", label: "Progress: high to low" },
  ];
  const sortValue = sorting[0] ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}` : "";

  const counts = useMemo(() => {
    const byModule = new Map<string, number>();
    narrowed.forEach((item) => byModule.set(item.module, (byModule.get(item.module) ?? 0) + 1));
    return byModule;
  }, [narrowed]);

  return (
    <section ref={ref} className={styles.section} aria-labelledby="bh-items-title" tabIndex={-1}>
      <div className={styles.header}>
        <div>
          <h2 id="bh-items-title" className={styles.title}>
            Module summaries
          </h2>
          <p className={styles.subtitle}>
            {rows.length} of {items.length} shown · select an item for details
          </p>
        </div>

        <div className={styles.tools}>
          <div className={styles.search}>
            <Icon name="search" size={14} />
            <input
              type="search"
              placeholder="Search items"
              aria-label="Search items"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <label className={styles.sort}>
            <span className="bh-sr-only">Sort items</span>
            <select
              value={sortValue}
              onChange={(event) => {
                const [id, direction] = event.target.value.split(":");
                setSorting(id ? [{ id, desc: direction === "desc" }] : []);
              }}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <button type="button" aria-pressed={view === "cards"} onClick={() => changeView("cards")}>
              <Icon name="cards" size={15} />
              <span>Cards</span>
            </button>
            <button type="button" aria-pressed={view === "table"} onClick={() => changeView("table")}>
              <Icon name="table" size={15} />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.moduleTabs} role="group" aria-label="Filter by module">
        <button type="button" aria-pressed={module === "all"} onClick={() => onModuleChange("all")}>
          All <span className={styles.count}>{narrowed.length}</span>
        </button>
        {MODULES.map((entry) => {
          const count = counts.get(entry.key) ?? 0;
          if (count === 0 && module !== entry.key) return null;
          return (
            <button
              key={entry.key}
              type="button"
              aria-pressed={module === entry.key}
              onClick={() => onModuleChange(entry.key)}
            >
              {entry.label} <span className={styles.count}>{count}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>No items match the current filters.</p>
          {crossFilter && (
            <button type="button" onClick={clearCrossFilter}>
              Remove “{crossFilter.label}”
            </button>
          )}
        </div>
      ) : view === "cards" ? (
        <ul className={styles.cards}>
          {rows.map(({ original: item }) => (
            <li key={item.id}>
              <button
                type="button"
                className={`${styles.card} ${item.id === selectedId ? styles.selected : ""}`}
                onClick={() => onOpen(item.id)}
                aria-haspopup="dialog"
              >
                <span className={styles.cardTop}>
                  <span className={styles.cardModule}>{moduleLabel(item.module)}</span>
                  <StatusPill status={item.status} />
                </span>
                <span className={styles.cardTitle}>{item.title}</span>
                <span className={styles.cardValueRow}>
                  <span className={styles.cardValue}>{item.display}</span>
                  <Sparkline data={item.trend} width={76} height={28} />
                </span>
                <span className={styles.cardMetric}>{item.metric}</span>
                {item.progress && <ProgressBar label={item.progress.label} value={item.progress.value} />}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="bh-sr-only">Dashboard items. Column headers sort the table.</caption>
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
                        {header.column.getCanSort() ? (
                          <button
                            type="button"
                            className={styles.sortButton}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <Icon
                              name={sorted === "asc" ? "arrowUp" : sorted === "desc" ? "arrowDown" : "sort"}
                              size={12}
                            />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
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
                  className={row.id === selectedId ? styles.selectedRow : undefined}
                  // Whole-row click for mouse users; the Item button is the keyboard target.
                  onClick={(event) => {
                    if (!(event.target as HTMLElement).closest("button")) onOpen(row.id);
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
    </section>
  );
});

function StatusPill({ status }: { status: DashboardItem["status"] }) {
  return <span className={`${styles.pill} ${styles[`pill-${status.tone}`]}`}>{status.label}</span>;
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <span className={styles.progress}>
      <span className={styles.progressLabel}>
        <span>{label}</span>
        <span className={styles.num}>{formatPercent(value)}</span>
      </span>
      <span className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${Math.min(value, 100)}%` }} />
      </span>
    </span>
  );
}
