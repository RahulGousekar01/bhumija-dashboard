/*
 * Governance types: T-1 batch metadata, the administrative register,
 * reconciliation, discrepancies, review sign-off and the audit trail.
 *
 * Dates are ISO strings (YYYY-MM-DD, or full ISO for timestamps). The UI
 * formats them as DD-MMM-YYYY, matching the main portal.
 */

/* ---------- T-1 batch ---------- */

export type SourceState = "reconciled" | "late" | "partial";

export interface DataSource {
  id: string;
  name: string;
  state: SourceState;
  /** When this source's T-1 batch arrived. */
  syncedAt: string | null;
  detail: string;
}

export interface AsOfInfo {
  /** The business day the data describes (T-1). */
  asOfDate: string;
  /** The latest day available; asOfDate < latestDate means a historical view. */
  latestDate: string;
  cutoff: string;
  batchId: string;
  batchSyncedAt: string;
  sources: DataSource[];
}

/* ---------- Register ---------- */

export type RecordType = "permit" | "tripsheet" | "challan" | "stock";

export type WorkflowStatus =
  | "Draft"
  | "Submitted"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Expired"
  | "Closed"
  | "Paid";

export type ReconState = "reconciled" | "variance" | "provisional";

export interface ReconSource {
  label: string;
  quantity: number;
}

export interface Reconciliation {
  state: ReconState;
  /** Largest difference between sources, as a % of the first. */
  variancePct: number;
  sources: ReconSource[];
  /** Source still awaited when provisional. */
  pendingSource?: string;
}

export type Severity = "high" | "medium" | "low";
export type DiscrepancyStatus = "Open" | "Under review" | "Resolved" | "Justified";

export interface Discrepancy {
  id: string;
  rule: string;
  severity: Severity;
  detail: string;
  status: DiscrepancyStatus;
  raisedOn: string;
}

export interface AuditEntry {
  at: string;
  by: string;
  designation: string;
  action: string;
  remark?: string;
  ackNo?: string;
}

export interface FeeLine {
  head: string;
  amount: number;
}

export interface RegisterRecord {
  id: string;
  refNo: string;
  type: RecordType;
  /** e.g. "Export permit", "Road tripsheet". */
  subtype: string;
  party: string;
  district: string;
  taluka: string;
  location: string;
  mineral: string;
  oreForm: "Lumps" | "Fines" | "ROM";
  gradeSlab: string;
  quantity: number;
  amount: number;
  /** Application / trip / challan date. */
  date: string;
  validUpto?: string;
  status: WorkflowStatus;
  /** Days since the record entered its current status. */
  ageDays: number;
  vehicle?: string;
  weighbridge?: string;
  fees?: FeeLine[];
  recon: Reconciliation;
  discrepancies: Discrepancy[];
  reviewed?: { by: string; designation: string; at: string; remark: string };
  audit: AuditEntry[];
  /** Review queues the record is in (empty when nothing is pending). */
  queues: string[];
}

/* ---------- Aggregates ---------- */

export type AgeBucket = "0–2 d" | "3–7 d" | "8–15 d" | ">15 d";
export const AGE_BUCKETS: AgeBucket[] = ["0–2 d", "3–7 d", "8–15 d", ">15 d"];

export interface AgeingRow {
  queue: string;
  buckets: Record<AgeBucket, number>;
  /** Items past the queue's SLA. */
  breaches: number;
  slaDays: number;
}

export interface RollupRow {
  key: string;
  name: string;
  level: "district" | "taluka";
  parent?: string;
  dispatch: number;
  revenue: number;
  permits: number;
  pending: number;
  discrepancies: number;
  /** Change vs the comparison period, in percent. */
  dispatchDelta: number;
  trend: number[];
}

export interface BaselinePoint {
  date: string;
  label: string;
  actual: number;
  /** Trailing 7-day mean. */
  baseline: number;
  /** True when a source batch for this day arrived late. */
  lateBatch: boolean;
}

export type TrendMetric = "dispatch" | "revenue" | "permits";

export interface KpiValue {
  value: number;
  /** Change vs the comparison period, in percent. */
  delta: number;
  /** Change vs the trailing 7-day mean, in percent. */
  vsBaseline: number;
  spark: number[];
  target?: number;
}

export type KpiId = "revenue" | "dispatch" | "permits" | "pending" | "discrepancies" | "expiring";

export interface StatusBreakdownRow {
  label: string;
  counts: Partial<Record<WorkflowStatus, number>>;
}

export interface SignOffRow {
  key: string;
  jurisdiction: string;
  officer: string;
  designation: string;
  state: "Signed off" | "Pending";
  signedAt?: string;
  remark?: string;
  openItems: number;
}

export interface GovernanceSnapshot {
  asOf: AsOfInfo;
  kpis: Record<KpiId, KpiValue>;
  trends: Record<TrendMetric, BaselinePoint[]>;
  statusBreakdown: StatusBreakdownRow[];
  rollup: RollupRow[];
  ageing: AgeingRow[];
  records: RegisterRecord[];
  signOff: SignOffRow[];
}

/* ---------- Actions ---------- */

export interface ActionResult {
  /** Acknowledgement number, as returned by the portal on saves. */
  ackNo: string;
}

export interface Officer {
  name: string;
  designation: string;
  office: string;
}
