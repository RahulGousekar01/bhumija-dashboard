import { useMemo } from "react";
import { DataTable, Icon, SlideOver, Tabs, type TabItem } from "../../components/ui";
import type { DashboardData } from "../../hooks/useDashboardData";
import { downloadCsv, type CsvTable } from "../../lib/csv";
import { formatNumber } from "../../lib/format";
import { moduleLabel, type DashboardItem } from "../items/buildItems";
import { getItemDetail } from "./itemDetails";
import styles from "./ItemDrawer.module.css";

interface ItemDrawerProps {
  item: DashboardItem | null;
  data: DashboardData;
  tab: string | null;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  /** Ids the drawer can step through (the grid's current order). */
  navigationIds: string[];
  onNavigate: (id: string) => void;
}

function RecordsTable({ records }: { records: CsvTable }) {
  return (
    <DataTable
      caption="Underlying records"
      rows={records.rows.map((cells, index) => ({ index, cells }))}
      rowKey={(row) => String(row.index)}
      columns={records.columns.map((header, columnIndex) => ({
        header,
        numeric: typeof records.rows[0]?.[columnIndex] === "number",
        cell: (row: { cells: (string | number)[] }) => {
          const value = row.cells[columnIndex];
          return typeof value === "number" ? formatNumber(value) : value;
        },
      }))}
    />
  );
}

/** The slide-over for one grid item: header stats, tabs, prev/next, CSV export. */
export function ItemDrawer({ item, data, tab, onTabChange, onClose, navigationIds, onNavigate }: ItemDrawerProps) {
  const detail = useMemo(() => (item ? getItemDetail(item, data) : null), [item, data]);

  if (!item || !detail) return null;

  const tabs: TabItem[] = [
    ...detail.tabs,
    { id: "records", label: "Records", content: <RecordsTable records={detail.records} /> },
  ];
  const activeTab = tabs.some((entry) => entry.id === tab) ? tab! : tabs[0]!.id;

  const index = navigationIds.indexOf(item.id);
  const step = (offset: number) => {
    if (navigationIds.length === 0) return;
    const next = navigationIds[(index + offset + navigationIds.length) % navigationIds.length];
    if (next) onNavigate(next);
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      eyebrow={moduleLabel(item.module)}
      title={item.title}
      description={detail.description}
      stats={detail.stats}
      nav={
        index >= 0
          ? { index, total: navigationIds.length, onPrevious: () => step(-1), onNext: () => step(1) }
          : undefined
      }
      actions={
        <button
          type="button"
          className={styles.exportButton}
          onClick={() => downloadCsv(`${item.id.replace(".", "-")}.csv`, detail.records)}
        >
          <Icon name="arrowDown" size={14} />
          Export CSV
        </button>
      }
    >
      {/* key: reset per-tab state (toggles) when moving to another item */}
      <Tabs key={item.id} label={`${item.title} details`} tabs={tabs} activeId={activeTab} onChange={onTabChange} />
    </SlideOver>
  );
}
