import { useEffect, useId, useState, type ReactNode } from "react";
import { Callout, Icon, SlideOver, Tabs, useToast, type TabItem } from "../../components/ui";
import { useDashboard } from "../../context/DashboardContext";
import { formatDate, formatDateTime } from "../../lib/dates";
import { formatCurrency, formatNumber, formatPercent, percentOf, sumBy } from "../../lib/format";
import type { DiscrepancyStatus, RegisterRecord, Severity } from "../../types/governance";
import { SEVERITY_LABEL } from "./OverviewPanels";
import { ReconTag, StatusChip } from "./RegisterGrid";
import { QUEUE_SLA, isOverSla } from "./registerFilters";
import styles from "./drawer.module.css";

const MIN_REMARK = 10;

const MANUAL_RULES = [
  "Quantity mismatch with field inspection",
  "Grade declared differs from assay",
  "Vehicle not on approved route (VTS)",
  "Documents incomplete or inconsistent",
  "Other (describe in remark)",
];

const TYPE_LABEL: Record<RegisterRecord["type"], string> = {
  permit: "Permit",
  tripsheet: "Tripsheet",
  challan: "e-Challan",
  stock: "Stock lot",
};

interface RecordDrawerProps {
  record: RegisterRecord | null;
  tab: string | null;
  onTabChange: (tab: string) => void;
  onClose: () => void;
  navigationIds: string[];
  onNavigate: (id: string) => void;
  onExport: (record: RegisterRecord, format: "PDF" | "Excel") => void;
  busyExport: string | null;
}

/** ≥60% slide-over with the full record: summary, reconciliation, fees, audit trail and review actions. */
export function RecordDrawer({
  record,
  tab,
  onTabChange,
  onClose,
  navigationIds,
  onNavigate,
  onExport,
  busyExport,
}: RecordDrawerProps) {
  if (!record) return null;

  const index = navigationIds.indexOf(record.id);
  const step = (offset: number) => {
    const next = navigationIds[(index + offset + navigationIds.length) % navigationIds.length];
    if (next) onNavigate(next);
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      eyebrow={`${TYPE_LABEL[record.type]} · ${record.taluka}`}
      title={record.refNo}
      description={`${record.subtype} · ${record.party}`}
      stats={[
        { label: "Quantity", value: `${formatNumber(record.quantity)} MT` },
        { label: record.type === "challan" ? "Amount" : "Royalty value", value: formatCurrency(record.amount) },
        { label: "Status", value: <StatusChip status={record.status} /> },
        {
          label: "Age in status",
          value: (
            <span className={isOverSla(record) ? styles.over : undefined}>
              {record.ageDays} days{isOverSla(record) ? " · past SLA" : ""}
            </span>
          ),
        },
        { label: "Reconciliation", value: <ReconTag record={record} /> },
      ]}
      nav={
        index >= 0 && navigationIds.length > 1
          ? { index, total: navigationIds.length, onPrevious: () => step(-1), onNext: () => step(1) }
          : undefined
      }
      footer={<DrawerActions key={record.id} record={record} onExport={onExport} busyExport={busyExport} onShowTab={onTabChange} />}
    >
      <RecordTabs key={record.id} record={record} tab={tab} onTabChange={onTabChange} />
    </SlideOver>
  );
}

/* =========================================================
   Tabs
   ========================================================= */

function RecordTabs({ record, tab, onTabChange }: { record: RegisterRecord; tab: string | null; onTabChange: (tab: string) => void }) {
  const { roleConfig } = useDashboard();
  const openFlags = record.discrepancies.filter((item) => item.status === "Open" || item.status === "Under review").length;

  const tabs: TabItem[] = [
    { id: "summary", label: "Summary", content: <SummaryTab record={record} /> },
    {
      id: "reconciliation",
      label: "Reconciliation",
      badge: openFlags || undefined,
      content: <ReconciliationTab record={record} />,
    },
    ...(record.fees ? [{ id: "fees", label: "Fee heads", content: <FeesTab record={record} /> }] : []),
    ...(roleConfig.permissions.audit
      ? [{ id: "audit", label: "Audit trail", badge: record.audit.length, content: <AuditTab record={record} /> }]
      : []),
  ];

  const active = tabs.some((item) => item.id === tab) ? tab! : "summary";
  return <Tabs label={`${record.refNo} details`} tabs={tabs} activeId={active} onChange={onTabChange} />;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.field}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function SummaryTab({ record }: { record: RegisterRecord }) {
  const workflow = record.audit.filter((entry) => entry.designation !== "T-1 batch" && entry.designation !== "Rule engine");
  const sla = record.queues.map((queue) => (QUEUE_SLA[queue] ? `${queue} (${QUEUE_SLA[queue]} d SLA)` : queue));

  return (
    <>
      {record.reviewed ? (
        <div className={styles.reviewedBanner}>
          <Icon name="shield" size={18} />
          <div>
            <strong>
              Reviewed by {record.reviewed.by}, {record.reviewed.designation}
            </strong>
            <span>
              {formatDateTime(record.reviewed.at)} · “{record.reviewed.remark}”
            </span>
          </div>
        </div>
      ) : record.queues.length > 0 ? (
        <Callout>
          <strong>Awaiting action:</strong> {sla.join(", ")}.
        </Callout>
      ) : null}

      <section className={styles.block} aria-labelledby="rec-details">
        <h3 id="rec-details" className={styles.blockTitle}>
          Record details
        </h3>
        <dl className={styles.fields}>
          <Field label="Reference">{record.refNo}</Field>
          <Field label="Type">{record.subtype}</Field>
          <Field label="Party">{record.party}</Field>
          <Field label="Jurisdiction">
            {record.district} › {record.taluka} › {record.location}
          </Field>
          <Field label="Mineral">{record.mineral}</Field>
          <Field label="Ore form · grade slab">
            {record.oreForm} · {record.gradeSlab}
          </Field>
          <Field label="Date">{formatDate(record.date)}</Field>
          {record.validUpto && <Field label="Valid up to">{formatDate(record.validUpto)}</Field>}
          {record.vehicle && <Field label={record.subtype.startsWith("Barge") ? "Vessel" : "Vehicle"}>{record.vehicle}</Field>}
          {record.weighbridge && <Field label="Weighbridge">{record.weighbridge}</Field>}
          <Field label="Quantity">{formatNumber(record.quantity)} MT</Field>
          <Field label="Value">{formatCurrency(record.amount)}</Field>
        </dl>
      </section>

      <section className={styles.block} aria-labelledby="rec-workflow">
        <h3 id="rec-workflow" className={styles.blockTitle}>
          Workflow
        </h3>
        <ol className={styles.steps}>
          {workflow.map((entry, position) => (
            <li key={`${entry.at}-${position}`} className={position === workflow.length - 1 ? styles.stepCurrent : undefined}>
              <span className={styles.stepDot} aria-hidden="true" />
              <div>
                <strong>{entry.action}</strong>
                <span>
                  {entry.by}
                  {entry.designation !== "Applicant" ? `, ${entry.designation}` : ""} · {formatDateTime(entry.at)}
                </span>
                {entry.remark && <em>“{entry.remark}”</em>}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

function ReconciliationTab({ record }: { record: RegisterRecord }) {
  const { recon } = record;
  const base = recon.sources[0]?.quantity ?? 0;
  const max = Math.max(...recon.sources.map((source) => source.quantity), 1);

  return (
    <>
      <div className={`${styles.reconBanner} ${styles[`recon-${recon.state}`]}`}>
        <Icon name={recon.state === "reconciled" ? "check" : recon.state === "variance" ? "alert" : "clock"} size={18} />
        <div>
          <strong>
            {recon.state === "reconciled"
              ? "Reconciled in the T-1 batch"
              : recon.state === "variance"
                ? `Variance of ${recon.variancePct}% between sources`
                : "Provisional — reconciliation pending"}
          </strong>
          <span>
            {recon.state === "provisional"
              ? `Awaiting ${recon.pendingSource}. Figures will be confirmed when the feed arrives.`
              : "Compared across the sources below."}
          </span>
        </div>
      </div>

      <section className={styles.block} aria-labelledby="rec-sources">
        <h3 id="rec-sources" className={styles.blockTitle}>
          Source comparison
        </h3>
        <table className={styles.table}>
          <caption className="bh-sr-only">Quantities reported by each source</caption>
          <thead>
            <tr>
              <th scope="col">Source</th>
              <th scope="col" className={styles.num}>
                Quantity (MT)
              </th>
              <th scope="col" className={styles.num}>
                Difference
              </th>
              <th scope="col" aria-hidden="true" />
            </tr>
          </thead>
          <tbody>
            {recon.sources.map((source, position) => {
              const diff = source.quantity - base;
              return (
                <tr key={source.label}>
                  <th scope="row">{source.label}</th>
                  <td className={styles.num}>{formatNumber(source.quantity)}</td>
                  <td className={styles.num}>
                    {position === 0 ? "—" : `${diff > 0 ? "+" : ""}${formatNumber(Math.round(diff * 1000) / 1000)} (${formatPercent(percentOf(Math.abs(diff), base), 1)})`}
                  </td>
                  <td className={styles.barCell} aria-hidden="true">
                    <span className={styles.bar}>
                      <span style={{ width: `${(source.quantity / max) * 100}%`, background: position === 0 ? "var(--bh-chart-1)" : "var(--bh-chart-4)" }} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <DiscrepancySection record={record} />
    </>
  );
}

function DiscrepancySection({ record }: { record: RegisterRecord }) {
  const { api, officer, roleConfig, refresh } = useDashboard();
  const toast = useToast();
  const canUpdate = roleConfig.permissions.flag && Boolean(api.updateDiscrepancy);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<"Under review" | "Resolved" | "Justified">("Under review");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const remarkId = useId();
  const statusId = useId();

  const save = async (discrepancyId: string) => {
    if (!api.updateDiscrepancy || remark.trim().length < MIN_REMARK) return;
    setSaving(true);
    try {
      const result = await api.updateDiscrepancy(record.id, discrepancyId, status, remark.trim(), officer);
      toast({ message: `Discrepancy marked ${status.toLowerCase()} · ${result.ackNo}` });
      setEditing(null);
      setRemark("");
      refresh();
    } catch (error) {
      toast({ message: `Update failed: ${(error as Error).message}`, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.block} aria-labelledby="rec-discrepancies">
      <h3 id="rec-discrepancies" className={styles.blockTitle}>
        Discrepancies ({record.discrepancies.length})
      </h3>
      {record.discrepancies.length === 0 ? (
        <p className={styles.muted}>No discrepancies raised for this record.</p>
      ) : (
        <ul className={styles.discList}>
          {record.discrepancies.map((item) => (
            <li key={item.id} className={styles.discItem}>
              <div className={styles.discHead}>
                <span className={`${styles.severity} ${styles[`sev-${item.severity}`]}`}>
                  <Icon name="flag" size={11} />
                  {SEVERITY_LABEL[item.severity]}
                </span>
                <strong>{item.rule}</strong>
                <span className={`${styles.discStatus} ${styles[`ds-${item.status.replace(" ", "")}` as const]}`}>{item.status}</span>
              </div>
              <p>{item.detail}</p>
              <span className={styles.muted}>Raised {formatDate(item.raisedOn)}</span>

              {canUpdate && (item.status === "Open" || item.status === "Under review") && editing !== item.id && (
                <button
                  type="button"
                  className={styles.linkButton}
                  onClick={() => {
                    setEditing(item.id);
                    setStatus(item.status === "Open" ? "Under review" : "Resolved");
                    setRemark("");
                  }}
                >
                  Update status
                </button>
              )}

              {editing === item.id && (
                <form
                  className={styles.inlineForm}
                  onSubmit={(event) => {
                    event.preventDefault();
                    save(item.id);
                  }}
                >
                  <div className={styles.formRow}>
                    <label htmlFor={statusId}>New status</label>
                    <select
                      id={statusId}
                      value={status}
                      onChange={(event) => setStatus(event.target.value as typeof status)}
                    >
                      {(["Under review", "Resolved", "Justified"] as DiscrepancyStatus[])
                        .filter((option) => option !== item.status)
                        .map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                    </select>
                  </div>
                  <label htmlFor={remarkId} className={styles.formLabel}>
                    Remark (required, min {MIN_REMARK} characters)
                  </label>
                  <textarea id={remarkId} rows={2} value={remark} onChange={(event) => setRemark(event.target.value)} autoFocus />
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.primary} disabled={saving || remark.trim().length < MIN_REMARK}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" className={styles.secondary} onClick={() => setEditing(null)} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FeesTab({ record }: { record: RegisterRecord }) {
  const fees = record.fees ?? [];
  const total = sumBy(fees, (fee) => fee.amount);
  return (
    <section className={styles.block} aria-labelledby="rec-fees">
      <h3 id="rec-fees" className={styles.blockTitle}>
        Fee heads for {formatNumber(record.quantity)} MT
      </h3>
      <table className={styles.table}>
        <caption className="bh-sr-only">Fee heads paid on this e-Challan</caption>
        <thead>
          <tr>
            <th scope="col">Head</th>
            <th scope="col" className={styles.num}>
              Amount
            </th>
            <th scope="col" className={styles.num}>
              Share
            </th>
            <th scope="col" aria-hidden="true" />
          </tr>
        </thead>
        <tbody>
          {fees.map((fee, position) => (
            <tr key={fee.head}>
              <th scope="row">{fee.head}</th>
              <td className={styles.num}>{formatCurrency(fee.amount)}</td>
              <td className={styles.num}>{formatPercent(percentOf(fee.amount, total))}</td>
              <td className={styles.barCell} aria-hidden="true">
                <span className={styles.bar}>
                  <span
                    style={{
                      width: `${percentOf(fee.amount, fees[0]?.amount ?? 1)}%`,
                      background: position === 0 ? "var(--bh-chart-1)" : "var(--bh-chart-4)",
                    }}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td className={styles.num}>{formatCurrency(total)}</td>
            <td className={styles.num}>100%</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </section>
  );
}

function AuditTab({ record }: { record: RegisterRecord }) {
  const entries = [...record.audit].reverse();
  return (
    <section className={styles.block} aria-labelledby="rec-audit">
      <h3 id="rec-audit" className={styles.blockTitle}>
        Audit trail
      </h3>
      <p className={styles.muted}>Append-only. Newest first. Entries cannot be edited or deleted.</p>
      <ol className={styles.audit}>
        {entries.map((entry, position) => (
          <li key={`${entry.at}-${position}`}>
            <span className={styles.auditTime}>{formatDateTime(entry.at)}</span>
            <div className={styles.auditBody}>
              <strong>{entry.action}</strong>
              <span>
                {entry.by} · {entry.designation}
              </span>
              {entry.remark && <em>“{entry.remark}”</em>}
              {entry.ackNo && <span className={styles.ack}>{entry.ackNo}</span>}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* =========================================================
   Footer actions (inline forms, no dialogs)
   ========================================================= */

interface DrawerActionsProps {
  record: RegisterRecord;
  onExport: (record: RegisterRecord, format: "PDF" | "Excel") => void;
  busyExport: string | null;
  onShowTab: (tab: string) => void;
}

function DrawerActions({ record, onExport, busyExport, onShowTab }: DrawerActionsProps) {
  const { api, officer, roleConfig, refresh } = useDashboard();
  const toast = useToast();
  const [mode, setMode] = useState<"review" | "flag" | null>(null);
  const [remark, setRemark] = useState("");
  const [rule, setRule] = useState(MANUAL_RULES[0]!);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [saving, setSaving] = useState(false);
  const remarkId = useId();
  const ruleId = useId();
  const severityId = useId();

  const canReview = roleConfig.permissions.review && Boolean(api.markReviewed) && !record.reviewed;
  const canFlag = roleConfig.permissions.flag && Boolean(api.flagDiscrepancy);

  useEffect(() => setRemark(""), [mode]);

  const submit = async () => {
    if (remark.trim().length < MIN_REMARK) return;
    setSaving(true);
    try {
      if (mode === "review" && api.markReviewed) {
        const result = await api.markReviewed(record.id, remark.trim(), officer);
        toast({ message: `${record.refNo} marked reviewed · ${result.ackNo}` });
      } else if (mode === "flag" && api.flagDiscrepancy) {
        const result = await api.flagDiscrepancy(record.id, { rule, severity, remark: remark.trim() }, officer);
        toast({ message: `Discrepancy flagged on ${record.refNo} · ${result.ackNo}` });
        onShowTab("reconciliation");
      }
      setMode(null);
      refresh();
    } catch (error) {
      toast({ message: `Action failed: ${(error as Error).message}`, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (mode) {
    return (
      <form
        className={styles.actionForm}
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className={styles.actionFormFields}>
          {mode === "flag" && (
            <>
              <div className={styles.formRow}>
                <label htmlFor={ruleId}>Discrepancy</label>
                <select id={ruleId} value={rule} onChange={(event) => setRule(event.target.value)}>
                  {MANUAL_RULES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formRow}>
                <label htmlFor={severityId}>Severity</label>
                <select id={severityId} value={severity} onChange={(event) => setSeverity(event.target.value as Severity)}>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </>
          )}
          <div className={styles.remarkField}>
            <label htmlFor={remarkId}>
              {mode === "review" ? "Review remark" : "Details"} (required, min {MIN_REMARK} characters)
            </label>
            <textarea
              id={remarkId}
              rows={2}
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder={mode === "review" ? "e.g. Verified against weighbridge slips and lease records." : "Describe what was found and where."}
              autoFocus
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <span className={styles.muted}>
            Recorded as {officer.name}, {officer.designation}
          </span>
          <button type="button" className={styles.secondary} onClick={() => setMode(null)} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className={styles.primary} disabled={saving || remark.trim().length < MIN_REMARK}>
            {saving ? "Saving…" : mode === "review" ? "Confirm review" : "Raise discrepancy"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className={styles.actions}>
      <div className={styles.actionGroup}>
        {canReview && (
          <button type="button" className={styles.primary} onClick={() => setMode("review")}>
            <Icon name="shield" size={15} /> Mark reviewed
          </button>
        )}
        {record.reviewed && (
          <span className={styles.reviewedNote}>
            <Icon name="check" size={14} /> Reviewed {formatDate(record.reviewed.at.slice(0, 10))}
          </span>
        )}
        {canFlag && (
          <button type="button" className={styles.secondary} onClick={() => setMode("flag")}>
            <Icon name="flag" size={14} /> Flag discrepancy
          </button>
        )}
        {!canReview && !canFlag && !record.reviewed && <span className={styles.muted}>View only for your role</span>}
      </div>
      <div className={styles.actionGroup}>
        <button type="button" className={styles.secondary} onClick={() => onExport(record, "PDF")} disabled={busyExport !== null}>
          <Icon name="download" size={14} /> {busyExport === "record:pdf" ? "Preparing…" : "Record sheet PDF"}
        </button>
        <button type="button" className={styles.secondary} onClick={() => onExport(record, "Excel")} disabled={busyExport !== null}>
          <Icon name="download" size={14} /> {busyExport === "record:xlsx" ? "Preparing…" : "Excel"}
        </button>
      </div>
    </div>
  );
}
