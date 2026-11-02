import { useId, useState } from "react";
import { Icon, useToast } from "../../components/ui";
import { useDashboard } from "../../context/DashboardContext";
import { formatDate, formatDateTime } from "../../lib/dates";
import type { SignOffRow } from "../../types/governance";
import styles from "./grid.module.css";

const MIN_REMARK = 10;

interface SignOffPanelProps {
  rows: SignOffRow[];
  asOfDate: string;
}

/**
 * Daily review sign-off: each jurisdiction's officer confirms the T-1 figures
 * were reviewed. Signing off happens inline with a mandatory remark.
 */
export function SignOffPanel({ rows, asOfDate }: SignOffPanelProps) {
  const { api, officer, roleConfig, refresh } = useDashboard();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const remarkId = useId();
  const canSignOff = roleConfig.permissions.signOff && Boolean(api.signOff);
  const signed = rows.filter((row) => row.state === "Signed off").length;

  const submit = async (row: SignOffRow) => {
    if (!api.signOff || remark.trim().length < MIN_REMARK) return;
    setSaving(true);
    try {
      const result = await api.signOff(row.key, remark.trim(), officer);
      toast({ message: `${row.jurisdiction} signed off for ${formatDate(asOfDate)} · ${result.ackNo}` });
      setEditing(null);
      setRemark("");
      refresh();
    } catch (error) {
      toast({ message: `Sign-off failed: ${(error as Error).message}`, tone: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.grid}>
      <div className={styles.signOffSummary}>
        <div className={styles.signOffMeter} aria-hidden="true">
          <span style={{ width: `${rows.length ? (signed / rows.length) * 100 : 0}%` }} />
        </div>
        <p>
          <strong>
            {signed} of {rows.length}
          </strong>{" "}
          jurisdictions have signed off the T-1 review for {formatDate(asOfDate)}.
        </p>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className="bh-sr-only">Daily review sign-off by jurisdiction</caption>
          <thead>
            <tr>
              <th scope="col">Jurisdiction</th>
              <th scope="col">Reviewing officer</th>
              <th scope="col" className={styles.numCell}>
                Open items
              </th>
              <th scope="col">Status</th>
              <th scope="col">Signed at</th>
              <th scope="col">Remark</th>
              {canSignOff && <th scope="col">Action</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row">{row.jurisdiction}</th>
                <td>
                  <span className={styles.stack}>
                    <span>{row.officer}</span>
                    <span className={styles.subtle}>{row.designation}</span>
                  </span>
                </td>
                <td className={styles.numCell}>{row.openItems}</td>
                <td>
                  <span className={`${styles.recon} ${row.state === "Signed off" ? styles.reconOk : styles.reconProvisional}`}>
                    <Icon name={row.state === "Signed off" ? "check" : "clock"} size={12} />
                    {row.state}
                  </span>
                </td>
                <td>{row.signedAt ? formatDateTime(row.signedAt) : "—"}</td>
                <td className={styles.remarkCell}>
                  {editing === row.key ? (
                    <form
                      className={styles.inlineForm}
                      onSubmit={(event) => {
                        event.preventDefault();
                        submit(row);
                      }}
                    >
                      <label htmlFor={remarkId} className="bh-sr-only">
                        Sign-off remark for {row.jurisdiction}
                      </label>
                      <textarea
                        id={remarkId}
                        rows={2}
                        value={remark}
                        placeholder={`Remark (min ${MIN_REMARK} characters)`}
                        onChange={(event) => setRemark(event.target.value)}
                        autoFocus
                      />
                      <div className={styles.inlineActions}>
                        <button type="submit" className={styles.primaryButton} disabled={saving || remark.trim().length < MIN_REMARK}>
                          {saving ? "Signing…" : "Confirm sign-off"}
                        </button>
                        <button type="button" onClick={() => setEditing(null)} disabled={saving}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    row.remark ?? <span className={styles.subtle}>—</span>
                  )}
                </td>
                {canSignOff && (
                  <td>
                    {row.state === "Pending" && editing !== row.key && (
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          setEditing(row.key);
                          setRemark("");
                        }}
                      >
                        Sign off
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
