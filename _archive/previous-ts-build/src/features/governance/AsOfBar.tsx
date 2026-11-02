import { useId, useState } from "react";
import { Icon } from "../../components/ui";
import { useDashboard } from "../../context/DashboardContext";
import { formatDate, formatDateTime, relativeDay } from "../../lib/dates";
import type { AsOfInfo, SourceState } from "../../types/governance";
import styles from "./governance.module.css";

const STATE_LABEL: Record<SourceState, string> = {
  reconciled: "Reconciled",
  partial: "Partial",
  late: "Awaited",
};

export interface ReportOption {
  id: string;
  title: string;
  description: string;
  onPdf: () => void;
  onExcel: () => void;
}

interface AsOfBarProps {
  asOf: AsOfInfo;
  reports: ReportOption[];
  /** True while a report file is being built. */
  busyReport: string | null;
}

/**
 * The T-1 rule, stated plainly: which day the figures describe, when the
 * batch landed and which source feeds are still provisional. Also hosts the
 * as-of date picker and the official report pack (inline panels, no popups).
 */
export function AsOfBar({ asOf, reports, busyReport }: AsOfBarProps) {
  const { filters, setFilter } = useDashboard();
  const [panel, setPanel] = useState<"sources" | "reports" | null>(null);
  const sourcesId = useId();
  const reportsId = useId();
  const dateId = useId();

  const reconciled = asOf.sources.filter((source) => source.state === "reconciled").length;
  const allReconciled = reconciled === asOf.sources.length;
  const historical = asOf.asOfDate < asOf.latestDate;

  const toggle = (next: "sources" | "reports") => setPanel((current) => (current === next ? null : next));

  return (
    <section className={styles.asOf} aria-label="Data recency">
      <div className={styles.asOfRow}>
        <div className={styles.asOfMain}>
          <span
            className={`${styles.asOfDot} ${allReconciled ? styles.dotOk : styles.dotWarn}`}
            aria-hidden="true"
          />
          <div>
            <p className={styles.asOfTitle}>
              Data as of: <strong>{relativeDay(asOf.asOfDate)}, {formatDate(asOf.asOfDate)}</strong> · {asOf.cutoff}
            </p>
            <p className={styles.asOfMeta}>
              T-1 consolidated batch <span className={styles.mono}>{asOf.batchId}</span> · synced{" "}
              {formatDateTime(asOf.batchSyncedAt)} · No live feeds
            </p>
          </div>
        </div>

        <div className={styles.asOfActions}>
          <button
            type="button"
            className={`${styles.sourceButton} ${allReconciled ? styles.sourceOk : styles.sourceWarn}`}
            aria-expanded={panel === "sources"}
            aria-controls={sourcesId}
            onClick={() => toggle("sources")}
          >
            <Icon name={allReconciled ? "check" : "alert"} size={14} />
            {reconciled} of {asOf.sources.length} sources reconciled
          </button>

          <div className={styles.dateField}>
            <label htmlFor={dateId}>As-of date</label>
            <input
              id={dateId}
              type="date"
              value={filters.asOfDate}
              max={asOf.latestDate}
              onChange={(event) => {
                const value = event.target.value;
                if (value && value <= asOf.latestDate) setFilter("asOfDate", value);
              }}
            />
          </div>

          <button
            type="button"
            className={styles.reportButton}
            aria-expanded={panel === "reports"}
            aria-controls={reportsId}
            onClick={() => toggle("reports")}
          >
            <Icon name="report" size={15} />
            Generate report
          </button>
        </div>
      </div>

      {historical && (
        <div className={styles.historical} role="status">
          <Icon name="history" size={16} />
          <span>
            Viewing the archived snapshot for <strong>{formatDate(asOf.asOfDate)}</strong>. Figures are as reconciled in
            that day's batch.
          </span>
          <button type="button" onClick={() => setFilter("asOfDate", asOf.latestDate)}>
            Return to latest ({formatDate(asOf.latestDate)})
          </button>
        </div>
      )}

      {!allReconciled && !historical && (
        <p className={styles.provisionalNote}>
          <Icon name="alert" size={14} />
          Figures depending on {asOf.sources.filter((source) => source.state !== "reconciled").map((source) => source.name).join(" and ")}{" "}
          are marked <span className={styles.provisionalTag}>Provisional</span> until their batch is reconciled.
        </p>
      )}

      <div id={sourcesId} hidden={panel !== "sources"} className={styles.panel}>
        <table className={styles.sourceTable}>
          <caption className="bh-sr-only">Source feeds in this batch</caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col">Status</th>
              <th scope="col">Synced</th>
              <th scope="col">Detail</th>
            </tr>
          </thead>
          <tbody>
            {asOf.sources.map((source) => (
              <tr key={source.id}>
                <th scope="row">{source.name}</th>
                <td>
                  <span className={`${styles.statePill} ${styles[`state-${source.state}`]}`}>
                    <Icon name={source.state === "reconciled" ? "check" : "clock"} size={12} />
                    {STATE_LABEL[source.state]}
                  </span>
                </td>
                <td>{source.syncedAt ? formatDateTime(source.syncedAt) : "—"}</td>
                <td>{source.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div id={reportsId} hidden={panel !== "reports"} className={styles.panel}>
        <p className={styles.panelIntro}>
          Official reports carry the DMG letterhead, a reference number, your name and designation, the data-as-of
          date and the filters applied. Every export is recorded in the audit trail.
        </p>
        <ul className={styles.reportList}>
          {reports.map((report) => (
            <li key={report.id} className={styles.reportCard}>
              <div>
                <strong>{report.title}</strong>
                <span>{report.description}</span>
              </div>
              <div className={styles.reportActions}>
                <button type="button" onClick={report.onPdf} disabled={busyReport !== null} aria-label={`${report.title}: download PDF`}>
                  <Icon name="download" size={14} />
                  {busyReport === `${report.id}:pdf` ? "Preparing…" : "PDF"}
                </button>
                <button type="button" onClick={report.onExcel} disabled={busyReport !== null} aria-label={`${report.title}: download Excel`}>
                  <Icon name="download" size={14} />
                  {busyReport === `${report.id}:xlsx` ? "Preparing…" : "Excel"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
