import { Icon, Sparkline } from "../../components/ui";
import { COMPARE_OPTIONS } from "../../config/filterOptions";
import { STATUS_ORDER } from "../../config/statusPalette";
import { useDashboard } from "../../context/DashboardContext";
import { formatCompactMT, formatCrore, formatDelta, formatNumber, formatPercent, percentOf, sumBy } from "../../lib/format";
import {
  AGE_BUCKETS,
  type AgeBucket,
  type GovernanceSnapshot,
  type RegisterRecord,
  type RollupRow,
  type Severity,
  type WorkflowStatus,
} from "../../types/governance";
import styles from "./governance.module.css";

/* =========================================================
   Permit status by type (100% stacked bars, portal colours)
   ========================================================= */

interface StatusBreakdownProps {
  snapshot: GovernanceSnapshot;
  onSelect: (filter: { subtype?: string; status?: WorkflowStatus }) => void;
}

export function StatusBreakdown({ snapshot, onSelect }: StatusBreakdownProps) {
  const { statusColors } = useDashboard();
  const rows = snapshot.statusBreakdown;
  const present = STATUS_ORDER.filter((status) => rows.some((row) => row.counts[status]));
  const totals = Object.fromEntries(
    present.map((status) => [status, sumBy(rows, (row) => row.counts[status] ?? 0)])
  ) as Record<WorkflowStatus, number>;

  return (
    <section className={styles.card} aria-labelledby="bh-status-title">
      <header className={styles.cardHeader}>
        <div>
          <h2 id="bh-status-title" className={styles.cardTitle}>
            Permit status by type
          </h2>
          <p className={styles.cardSubtitle}>Workflow position of permits in the period · select to filter the register</p>
        </div>
      </header>

      <ul className={styles.stackList}>
        {rows.map((row) => {
          const total = sumBy(present, (status) => row.counts[status] ?? 0);
          return (
            <li key={row.label}>
              <button type="button" className={styles.stackRow} onClick={() => onSelect({ subtype: row.label })}>
                <span className={styles.stackLabel}>
                  {row.label.replace(" permit", "")}
                  <span>{formatNumber(total)}</span>
                </span>
                <span className={styles.stackBar} aria-hidden="true">
                  {present.map((status) =>
                    row.counts[status] ? (
                      <span
                        key={status}
                        style={{
                          width: `${percentOf(row.counts[status] ?? 0, total)}%`,
                          background: statusColors[status].solid,
                        }}
                      />
                    ) : null
                  )}
                </span>
                <span className="bh-sr-only">
                  {present
                    .filter((status) => row.counts[status])
                    .map((status) => `${row.counts[status]} ${status}`)
                    .join(", ")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul className={styles.statusLegend} aria-label="Filter by status">
        {present.map((status) => (
          <li key={status}>
            <button type="button" onClick={() => onSelect({ status })}>
              <span className={styles.swatch} style={{ background: statusColors[status].solid }} />
              {status}
              <strong>{totals[status]}</strong>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================================================
   Jurisdiction rollup (heat-shaded table with drill-down)
   ========================================================= */

interface RollupTableProps {
  rows: RollupRow[];
  onDrill: (row: RollupRow) => void;
}

export function RollupTable({ rows, onDrill }: RollupTableProps) {
  const { filters } = useDashboard();
  const compareLabel = COMPARE_OPTIONS.find((option) => option.value === filters.compare)?.label.toLowerCase();
  const talukaRows = rows.filter((row) => row.level === "taluka");
  const maxDispatch = Math.max(...talukaRows.map((row) => row.dispatch), 1);
  const maxDiscrepancies = Math.max(...talukaRows.map((row) => row.discrepancies), 1);

  return (
    <section className={styles.card} aria-labelledby="bh-rollup-title">
      <header className={styles.cardHeader}>
        <div>
          <h2 id="bh-rollup-title" className={styles.cardTitle}>
            Jurisdiction rollup
          </h2>
          <p className={styles.cardSubtitle}>District › taluka · select a row to drill into it</p>
        </div>
      </header>

      <div className={styles.tableScroll}>
        <table className={styles.rollup}>
          <caption className="bh-sr-only">Figures by district and taluka for the period</caption>
          <thead>
            <tr>
              <th scope="col">Jurisdiction</th>
              <th scope="col" className={styles.num}>
                Dispatch
              </th>
              <th scope="col" className={styles.num}>
                Δ vs {compareLabel}
              </th>
              <th scope="col" className={styles.num}>
                Revenue
              </th>
              <th scope="col" className={styles.num}>
                Permits
              </th>
              <th scope="col" className={styles.num}>
                Pending
              </th>
              <th scope="col" className={styles.num}>
                Discrep.
              </th>
              <th scope="col">12-day trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDistrict = row.level === "district";
              const heat = isDistrict ? 0 : row.dispatch / maxDispatch;
              const discrepancyHeat = isDistrict ? 0 : row.discrepancies / maxDiscrepancies;
              return (
                <tr key={row.key} className={isDistrict ? styles.districtRow : undefined}>
                  <th scope="row">
                    <button type="button" className={styles.drillButton} onClick={() => onDrill(row)}>
                      {!isDistrict && <span className={styles.indent} aria-hidden="true" />}
                      {row.name}
                      <Icon name="chevronRight" size={12} />
                    </button>
                  </th>
                  <td
                    className={styles.num}
                    style={heat ? { background: `rgba(255, 107, 114, ${0.08 + heat * 0.28})` } : undefined}
                  >
                    {formatCompactMT(row.dispatch)}
                  </td>
                  <td className={`${styles.num} ${row.dispatchDelta >= 0 ? styles.textGood : styles.textBad}`}>
                    {formatDelta(row.dispatchDelta)}
                  </td>
                  <td className={styles.num}>{formatCrore(row.revenue)}</td>
                  <td className={styles.num}>{formatNumber(row.permits)}</td>
                  <td className={styles.num}>{formatNumber(row.pending)}</td>
                  <td
                    className={styles.num}
                    style={discrepancyHeat ? { background: `rgba(196, 38, 46, ${discrepancyHeat * 0.16})` } : undefined}
                  >
                    {formatNumber(row.discrepancies)}
                  </td>
                  <td>
                    <Sparkline data={row.trend} width={72} height={20} filled={false} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =========================================================
   Ageing by queue
   ========================================================= */

const BUCKET_COLORS: Record<AgeBucket, string> = {
  "0–2 d": "#d9dee5",
  "3–7 d": "#a7b3c2",
  "8–15 d": "#ffb3b6",
  ">15 d": "#c93a43",
};

interface AgeingChartProps {
  snapshot: GovernanceSnapshot;
  onSelect: (queue: string) => void;
}

export function AgeingChart({ snapshot, onSelect }: AgeingChartProps) {
  const totalBreaches = sumBy(snapshot.ageing, (row) => row.breaches);

  return (
    <section className={styles.card} aria-labelledby="bh-ageing-title">
      <header className={styles.cardHeader}>
        <div>
          <h2 id="bh-ageing-title" className={styles.cardTitle}>
            Ageing &amp; SLA
          </h2>
          <p className={styles.cardSubtitle}>Open items by days in current status</p>
        </div>
        <span className={`${styles.breachBadge} ${totalBreaches ? styles.breachOn : ""}`}>
          <Icon name={totalBreaches ? "alert" : "check"} size={13} />
          {totalBreaches} past SLA
        </span>
      </header>

      <ul className={styles.stackList}>
        {snapshot.ageing.map((row) => {
          const total = sumBy(AGE_BUCKETS, (bucket) => row.buckets[bucket]);
          return (
            <li key={row.queue}>
              <button type="button" className={styles.stackRow} onClick={() => onSelect(row.queue)}>
                <span className={styles.stackLabel}>
                  {row.queue}
                  <span>
                    {formatNumber(total)}
                    {row.breaches > 0 && <em className={styles.breachText}> · {row.breaches} &gt; {row.slaDays}d SLA</em>}
                  </span>
                </span>
                <span className={styles.stackBar} aria-hidden="true">
                  {total === 0 ? (
                    <span className={styles.emptyBar} />
                  ) : (
                    AGE_BUCKETS.map((bucket) =>
                      row.buckets[bucket] ? (
                        <span
                          key={bucket}
                          style={{ width: `${percentOf(row.buckets[bucket], total)}%`, background: BUCKET_COLORS[bucket] }}
                        />
                      ) : null
                    )
                  )}
                </span>
                <span className="bh-sr-only">
                  {AGE_BUCKETS.map((bucket) => `${row.buckets[bucket]} aged ${bucket}`).join(", ")}; SLA {row.slaDays} days
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <ul className={styles.legend} aria-hidden="true">
        {AGE_BUCKETS.map((bucket) => (
          <li key={bucket}>
            <span className={styles.swatch} style={{ background: BUCKET_COLORS[bucket] }} /> {bucket}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* =========================================================
   Discrepancy register preview
   ========================================================= */

const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

export const SEVERITY_LABEL: Record<Severity, string> = { high: "High", medium: "Medium", low: "Low" };

interface DiscrepancyPreviewProps {
  records: RegisterRecord[];
  asOfDate: string;
  onOpen: (recordId: string) => void;
  onViewAll: () => void;
}

export function DiscrepancyPreview({ records, asOfDate, onOpen, onViewAll }: DiscrepancyPreviewProps) {
  const open = records
    .flatMap((record) =>
      record.discrepancies
        .filter((item) => item.status === "Open" || item.status === "Under review")
        .map((item) => ({ record, item }))
    )
    .sort(
      (a, b) =>
        SEVERITY_RANK[a.item.severity] - SEVERITY_RANK[b.item.severity] || a.item.raisedOn.localeCompare(b.item.raisedOn)
    );

  const ageOf = (raisedOn: string) => Math.max(0, Math.round((Date.parse(asOfDate) - Date.parse(raisedOn)) / 86_400_000));

  return (
    <section className={styles.card} aria-labelledby="bh-disc-title">
      <header className={styles.cardHeader}>
        <div>
          <h2 id="bh-disc-title" className={styles.cardTitle}>
            Discrepancy register
          </h2>
          <p className={styles.cardSubtitle}>
            {open.length} open · {open.filter(({ item }) => item.severity === "high").length} high severity · rule-based checks on the T-1 batch
          </p>
        </div>
        {open.length > 0 && (
          <button type="button" className={styles.linkButton} onClick={onViewAll}>
            View all in register →
          </button>
        )}
      </header>

      {open.length === 0 ? (
        <p className={styles.emptyNote}>
          <Icon name="check" size={16} /> No open discrepancies for this scope.
        </p>
      ) : (
        <ul className={styles.discList}>
          {open.slice(0, 6).map(({ record, item }) => (
            <li key={item.id}>
              <button type="button" className={styles.discRow} onClick={() => onOpen(record.id)} aria-haspopup="dialog">
                <span className={`${styles.severity} ${styles[`sev-${item.severity}`]}`}>
                  <Icon name="flag" size={11} />
                  {SEVERITY_LABEL[item.severity]}
                </span>
                <span className={styles.discMain}>
                  <strong>{item.rule}</strong>
                  <span>
                    {record.refNo} · {record.party} · {record.taluka}
                  </span>
                </span>
                <span className={styles.discMeta}>
                  <span>{ageOf(item.raisedOn)} d</span>
                  <span className={styles.discStatus}>{item.status}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* =========================================================
   Revenue by fee head (split of the period's collection)
   ========================================================= */

/** Rates per MT used to split collections by head (royalty, DMF 10%, NMET 2%, GIOPF). */
const FEE_SPLIT = [
  { head: "Royalty", perMt: 452, note: "15% of ASP (notified)" },
  { head: "DMF", perMt: 45.2, note: "10% of royalty" },
  { head: "GIOPF", perMt: 45, note: "Goa Iron Ore Permanent Fund" },
  { head: "NMET", perMt: 9.04, note: "2% of royalty" },
];

export function FeeHeadBars({ total }: { total: number }) {
  const perMt = sumBy(FEE_SPLIT, (fee) => fee.perMt);
  const rows = FEE_SPLIT.map((fee) => ({ ...fee, amount: (total * fee.perMt) / perMt }));
  const max = rows[0]?.amount ?? 1;

  return (
    <section className={styles.card} aria-labelledby="bh-fees-title">
      <header className={styles.cardHeader}>
        <div>
          <h2 id="bh-fees-title" className={styles.cardTitle}>
            Collection by fee head
          </h2>
          <p className={styles.cardSubtitle}>{formatCrore(total)} in the period · e-Challan bank scroll</p>
        </div>
      </header>
      <ul className={styles.feeList}>
        {rows.map((row, index) => (
          <li key={row.head} className={styles.feeRow}>
            <span className={styles.feeName}>
              {row.head}
              <span>{row.note}</span>
            </span>
            <span className={styles.feeBar} aria-hidden="true">
              <span
                style={{
                  width: `${(row.amount / max) * 100}%`,
                  background: index === 0 ? "var(--bh-chart-1)" : "var(--bh-chart-4)",
                }}
              />
            </span>
            <span className={styles.feeValue}>
              <strong>{formatCrore(row.amount)}</strong>
              <span>{formatPercent(percentOf(row.amount, total))}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
