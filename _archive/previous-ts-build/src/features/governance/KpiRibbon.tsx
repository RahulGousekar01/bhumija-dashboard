import { Icon, Sparkline } from "../../components/ui";
import { COMPARE_OPTIONS, PERIODS } from "../../config/filterOptions";
import { useDashboard } from "../../context/DashboardContext";
import { formatCompactMT, formatCrore, formatDelta, formatNumber, formatPercent, percentOf } from "../../lib/format";
import type { GovernanceSnapshot, KpiId } from "../../types/governance";
import styles from "./governance.module.css";

interface KpiDef {
  id: KpiId;
  label: string;
  format: (value: number) => string;
  /** For backlog KPIs a rise is bad. */
  higherIsBetter: boolean;
  caption: string;
  actionLabel: string;
}

const KPIS: KpiDef[] = [
  { id: "revenue", label: "Revenue collected", format: formatCrore, higherIsBetter: true, caption: "Royalty, DMF, NMET, GIOPF", actionLabel: "Show e-Challans" },
  { id: "dispatch", label: "Ore dispatched", format: formatCompactMT, higherIsBetter: true, caption: "Weighbridge-confirmed", actionLabel: "Show tripsheets" },
  { id: "permits", label: "Permits issued", format: formatNumber, higherIsBetter: true, caption: "Import, export, transit, sale", actionLabel: "Show permits" },
  { id: "pending", label: "Approvals > 7 days", format: formatNumber, higherIsBetter: false, caption: "Permit approvals past SLA", actionLabel: "Show overdue approvals" },
  { id: "discrepancies", label: "Open discrepancies", format: formatNumber, higherIsBetter: false, caption: "Open or under review", actionLabel: "Show discrepancies" },
  { id: "expiring", label: "Permits expiring", format: formatNumber, higherIsBetter: false, caption: "Within 7 days of as-of date", actionLabel: "Show expiring permits" },
];

interface KpiRibbonProps {
  snapshot: GovernanceSnapshot;
  onSelect: (id: KpiId) => void;
}

/** Six review KPIs: T-1 value, change vs the comparison, vs 7-day average, sparkline. */
export function KpiRibbon({ snapshot, onSelect }: KpiRibbonProps) {
  const { filters } = useDashboard();
  const compareLabel = COMPARE_OPTIONS.find((option) => option.value === filters.compare)?.label.toLowerCase() ?? "";
  const periodLabel = PERIODS.find((period) => period.value === filters.period)?.long ?? "";
  const weighbridgePartial =
    snapshot.asOf.asOfDate === snapshot.asOf.latestDate &&
    snapshot.asOf.sources.some((source) => source.id === "weighbridge" && source.state !== "reconciled");

  return (
    <ul className={styles.kpiRibbon} aria-label={`Key figures for ${periodLabel}`}>
      {KPIS.map((kpi) => {
        const value = snapshot.kpis[kpi.id];
        const good = kpi.higherIsBetter ? value.delta >= 0 : value.delta <= 0;
        const provisional = weighbridgePartial && (kpi.id === "dispatch" || kpi.id === "revenue");
        const targetShare = value.target ? percentOf(value.value, value.target) : null;

        return (
          <li key={kpi.id}>
            <button type="button" className={styles.kpi} onClick={() => onSelect(kpi.id)}>
              <span className={styles.kpiTop}>
                <span className={styles.kpiLabel}>{kpi.label}</span>
                {provisional && <span className={styles.provisionalTag}>Provisional</span>}
              </span>

              <span className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{kpi.format(value.value)}</span>
                <Sparkline
                  data={value.spark}
                  width={64}
                  height={24}
                  color={kpi.higherIsBetter ? "var(--bh-chart-1)" : "var(--bh-chart-2)"}
                />
              </span>

              {targetShare !== null && (
                <span className={styles.bullet}>
                  <span className={styles.bulletTrack} aria-hidden="true">
                    <span style={{ width: `${Math.min(targetShare, 100)}%` }} />
                    <span className={styles.bulletMarker} />
                  </span>
                  <span className={styles.bulletLabel}>
                    {formatPercent(targetShare)} of {formatCrore(value.target ?? 0)} target
                  </span>
                </span>
              )}

              <span className={styles.kpiDeltas}>
                <span className={`${styles.delta} ${good ? styles.deltaGood : styles.deltaBad}`}>
                  <Icon name={value.delta >= 0 ? "arrowUp" : "arrowDown"} size={11} />
                  {formatDelta(value.delta)}
                  <span className={styles.deltaHint}>vs {compareLabel}</span>
                </span>
                <span className={styles.deltaSecondary}>
                  {formatDelta(value.vsBaseline)} vs 7-day avg
                </span>
              </span>

              {targetShare === null && <span className={styles.kpiCaption}>{kpi.caption}</span>}
              <span className="bh-sr-only">. {kpi.actionLabel} in the register</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
