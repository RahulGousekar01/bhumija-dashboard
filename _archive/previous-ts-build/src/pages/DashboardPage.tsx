import { useCallback, useMemo, useRef, useState } from "react";
import { Icon, Tabs, ToastProvider, type TabItem } from "../components/ui";
import { useDashboard } from "../context/DashboardContext";
import { ItemDrawer } from "../features/details/ItemDrawer";
import { AsOfBar, type ReportOption } from "../features/governance/AsOfBar";
import { FilterBar } from "../features/governance/FilterBar";
import { KpiRibbon } from "../features/governance/KpiRibbon";
import {
  AgeingChart,
  DiscrepancyPreview,
  FeeHeadBars,
  RollupTable,
  StatusBreakdown,
} from "../features/governance/OverviewPanels";
import { RecordDrawer } from "../features/governance/RecordDrawer";
import { RegisterGrid } from "../features/governance/RegisterGrid";
import { REPORT_TEMPLATES, recordSheet, type ReportContext } from "../features/governance/reportTemplates";
import { EMPTY_REGISTER_FILTER, type RegisterFilter, type WorkTab } from "../features/governance/registerFilters";
import { SignOffPanel } from "../features/governance/SignOffPanel";
import { TrendBaseline } from "../features/governance/TrendBaseline";
import { useReports } from "../features/governance/useReports";
import governance from "../features/governance/governance.module.css";
import { buildItems, type ModuleKey } from "../features/items/buildItems";
import { ItemGrid } from "../features/items/ItemGrid";
import { useDashboardData, type DashboardData } from "../hooks/useDashboardData";
import { formatDate } from "../lib/dates";
import { usePanelState } from "../hooks/usePanelState";
import type { KpiId, RegisterRecord } from "../types/governance";
import styles from "./DashboardPage.module.css";

/** The dashboard content. Must be rendered inside <DashboardProvider>. */
export function DashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}

function DashboardContent() {
  const query = useDashboardData();

  return (
    <div className={`bh-dashboard ${styles.page}`}>
      <PageTitle />
      {query.status === "success" ? (
        <LoadedDashboard data={query.data} />
      ) : query.status === "error" ? (
        <div className={styles.error} role="alert">
          <Icon name="alert" size={18} />
          <span>Couldn’t load the dashboard. {query.error.message}</span>
          <button type="button" onClick={query.retry}>
            <Icon name="refresh" size={14} /> Retry
          </button>
        </div>
      ) : (
        <DashboardSkeleton />
      )}
    </div>
  );
}

function PageTitle() {
  const { roleConfig, isParty } = useDashboard();
  return (
    <div className={styles.titleRow}>
      <div>
        <h1 className={styles.title}>
          Mining Operations Dashboard
          <span className={styles.roleTag}>{roleConfig.label}</span>
        </h1>
        <p className={styles.subtitle}>
          {isParty
            ? `Your organisation's figures · ${roleConfig.user.office}`
            : "Directorate of Mines & Geology · daily review of previous-day (T-1) consolidated data"}
        </p>
      </div>
    </div>
  );
}

const KPI_TARGETS: Record<KpiId, Partial<RegisterFilter>> = {
  revenue: { tab: "register", type: "challan" },
  dispatch: { tab: "register", type: "tripsheet" },
  permits: { tab: "register", type: "permit" },
  pending: { tab: "queue", queue: "Permit approvals" },
  discrepancies: { tab: "queue", queue: "Discrepancies" },
  expiring: { tab: "queue", queue: "Expiring permits" },
};

function LoadedDashboard({ data }: { data: DashboardData }) {
  const { roleConfig, filters, officer, setFilter, refresh, isParty } = useDashboard();
  const snapshot = data.governance;
  const panel = usePanelState();
  const reports = useReports();
  const workRef = useRef<HTMLElement>(null);

  const [registerFilter, setRegisterFilter] = useState<RegisterFilter>(EMPTY_REGISTER_FILTER);
  const [visibleIds, setVisibleIds] = useState<string[]>([]);
  const [module, setModule] = useState<ModuleKey | "all">("all");
  const [visibleModuleIds, setVisibleModuleIds] = useState<string[]>([]);
  const [visibleRecords, setVisibleRecords] = useState<RegisterRecord[]>([]);

  const items = useMemo(() => buildItems(data, roleConfig), [data, roleConfig]);
  const recordsById = useMemo(() => new Map(snapshot.records.map((record) => [record.id, record])), [snapshot.records]);

  const updateRegister = useCallback((next: Partial<RegisterFilter>) => {
    setRegisterFilter((current) => ({ ...current, ...next }));
  }, []);

  /** Apply a filter from an overview widget and bring the work area into view. */
  const focusWork = useCallback((next: Partial<RegisterFilter>) => {
    setRegisterFilter({ ...EMPTY_REGISTER_FILTER, ...next });
    requestAnimationFrame(() => {
      workRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      workRef.current?.focus({ preventScroll: true });
    });
  }, []);

  const handleVisibleChange = useCallback(
    (ids: string[]) => {
      setVisibleIds(ids);
      setVisibleRecords(ids.map((id) => recordsById.get(id)).filter((record): record is RegisterRecord => Boolean(record)));
    },
    [recordsById]
  );

  const reportContext: ReportContext = { snapshot, filters, officer, visibleRecords };

  const reportOptions: ReportOption[] = REPORT_TEMPLATES.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    onPdf: () => reports.run(template.id, "PDF", () => template.build(reportContext)),
    onExcel: () => reports.run(template.id, "Excel", () => template.build(reportContext)),
  }));

  const exportRegister = (records: RegisterRecord[], format: "PDF" | "Excel") => {
    const template = REPORT_TEMPLATES.find((item) => item.id === "register")!;
    reports.run("register", format, () => template.build({ ...reportContext, visibleRecords: records }));
  };

  const exportRecord = async (record: RegisterRecord, format: "PDF" | "Excel") => {
    await reports.run("record", format, () => recordSheet(reportContext, record), record.id);
    refresh();
  };

  /* Drawer: a register record, or a module summary item. */
  const selectedRecord = panel.panelId ? recordsById.get(panel.panelId) ?? null : null;
  const selectedItem = !selectedRecord && panel.panelId ? items.find((item) => item.id === panel.panelId) ?? null : null;
  const recordNav = selectedRecord && visibleIds.includes(selectedRecord.id) ? visibleIds : snapshot.records.map((record) => record.id);
  const itemNav = selectedItem && visibleModuleIds.includes(selectedItem.id) ? visibleModuleIds : items.map((item) => item.id);

  const queueCount = snapshot.records.filter((record) => record.queues.length > 0).length;
  const signedOff = snapshot.signOff.filter((row) => row.state === "Signed off").length;

  const workTabs: TabItem[] = [
    {
      id: "queue",
      label: "Review queue",
      badge: queueCount,
      content: (
        <RegisterGrid
          records={snapshot.records}
          filter={{ ...registerFilter, tab: "queue" }}
          onFilterChange={updateRegister}
          selectedId={panel.panelId}
          onOpen={(id) => panel.open(id)}
          onVisibleChange={handleVisibleChange}
          onExport={exportRegister}
        />
      ),
    },
    {
      id: "register",
      label: "Register",
      badge: snapshot.records.length,
      content: (
        <RegisterGrid
          records={snapshot.records}
          filter={{ ...registerFilter, tab: "register" }}
          onFilterChange={updateRegister}
          selectedId={panel.panelId}
          onOpen={(id) => panel.open(id)}
          onVisibleChange={handleVisibleChange}
          onExport={exportRegister}
        />
      ),
    },
    {
      id: "modules",
      label: "Module summaries",
      content: (
        <ItemGrid
          items={items}
          module={module}
          onModuleChange={setModule}
          selectedId={panel.panelId}
          onOpen={(id) => panel.open(id)}
          onVisibleChange={setVisibleModuleIds}
        />
      ),
    },
    ...(!isParty
      ? [
          {
            id: "signoff",
            label: "Sign-off",
            badge: `${signedOff}/${snapshot.signOff.length}`,
            content: <SignOffPanel rows={snapshot.signOff} asOfDate={snapshot.asOf.asOfDate} />,
          },
        ]
      : []),
  ];

  return (
    <>
      <AsOfBar asOf={snapshot.asOf} reports={reportOptions} busyReport={reports.busy} />
      <FilterBar />

      <KpiRibbon snapshot={snapshot} onSelect={(id) => focusWork(KPI_TARGETS[id])} />

      <div className={governance.overview}>
        <div className={governance.span8}>
          <TrendBaseline snapshot={snapshot} />
        </div>
        <div className={governance.span4}>
          <StatusBreakdown
            snapshot={snapshot}
            onSelect={({ subtype, status }) =>
              focusWork({ tab: "register", type: "permit", subtype: subtype ?? null, statuses: status ? [status] : [] })
            }
          />
        </div>
        <div className={governance.span7}>
          <RollupTable
            rows={snapshot.rollup}
            onDrill={(row) => {
              if (row.level === "district") {
                setFilter("district", row.name);
              } else {
                if (row.parent) setFilter("district", row.parent);
                setFilter("taluka", row.name);
              }
            }}
          />
        </div>
        <div className={governance.span5}>
          <FeeHeadBars total={snapshot.kpis.revenue.value} />
        </div>
        <div className={governance.span5}>
          <AgeingChart snapshot={snapshot} onSelect={(queue) => focusWork({ tab: "queue", queue })} />
        </div>
        <div className={governance.span7}>
          <DiscrepancyPreview
            records={snapshot.records}
            asOfDate={snapshot.asOf.asOfDate}
            onOpen={(id) => panel.open(id)}
            onViewAll={() => focusWork({ tab: "queue", queue: "Discrepancies" })}
          />
        </div>
      </div>

      <section ref={workRef} className={governance.work} aria-labelledby="bh-work-title" tabIndex={-1}>
        <div className={governance.workHeader}>
          <h2 id="bh-work-title">Work area</h2>
          <p>Records as of {formatDate(snapshot.asOf.asOfDate)} · select a row for full details</p>
        </div>
        <Tabs
          variant="page"
          label="Work area"
          tabs={workTabs}
          activeId={registerFilter.tab}
          onChange={(tab) => setRegisterFilter((current) => ({ ...current, tab: tab as WorkTab, queue: null }))}
        />
      </section>

      <RecordDrawer
        record={selectedRecord}
        tab={panel.tab}
        onTabChange={panel.setTab}
        onClose={panel.close}
        navigationIds={recordNav}
        onNavigate={(id) => panel.open(id)}
        onExport={exportRecord}
        busyExport={reports.busy}
      />

      <ItemDrawer
        item={selectedItem}
        data={data}
        tab={panel.tab}
        onTabChange={panel.setTab}
        onClose={panel.close}
        navigationIds={itemNav}
        onNavigate={(id) => panel.open(id)}
      />
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.block} style={{ height: 70 }} />
      <div className={styles.block} style={{ height: 96 }} />
      <div className={styles.block} style={{ height: 140 }} />
      <div className={styles.skeletonSplit}>
        <div className={styles.block} style={{ height: 330 }} />
        <div className={styles.block} style={{ height: 330 }} />
      </div>
      <span className="bh-sr-only" role="status">
        Loading dashboard
      </span>
    </div>
  );
}

