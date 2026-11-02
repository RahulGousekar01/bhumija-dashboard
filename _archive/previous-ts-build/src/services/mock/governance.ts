import { ALL, ORGANISATIONS, TALUKAS_BY_DISTRICT, talukasFor } from "../../config/filterOptions";
import { PROTOTYPE_PARTY } from "../../config/roleConfig";
import {
  addDays,
  daysBetween,
  financialYearStart,
  formatDayMonth,
  latestT1,
  monthStart,
} from "../../lib/dates";
import { hashString, seededRandom } from "../../lib/random";
import type { ComparePeriod, DashboardScope } from "../../types/dashboard";
import {
  AGE_BUCKETS,
  type ActionResult,
  type AgeBucket,
  type AgeingRow,
  type AuditEntry,
  type GovernanceSnapshot,
  type KpiId,
  type KpiValue,
  type Officer,
  type RegisterRecord,
  type RollupRow,
  type Severity,
  type SignOffRow,
  type StatusBreakdownRow,
  type TrendMetric,
  type BaselinePoint,
  type WorkflowStatus,
} from "../../types/governance";
import { batchSources, getUniverse } from "./register";

/*
 * Prototype governance API: builds the T-1 snapshot for a scope and applies
 * officer actions to the in-memory register. The real backend returns the
 * same shapes (see integration/README.md for the proposed gateway modes).
 */

/* ---------- Scope helpers ---------- */

const TALUKA_SHARE: Record<string, number> = {
  Bicholim: 0.32,
  Sattari: 0.2,
  Sanguem: 0.18,
  Dharbandora: 0.17,
  Quepem: 0.13,
};

const ORG_WEIGHTS = ORGANISATIONS.map((_, rank) => 6 - rank);
const ORG_TOTAL = ORG_WEIGHTS.reduce((sum, weight) => sum + weight, 0);

const scopeTalukas = (scope: DashboardScope): string[] =>
  scope.taluka !== ALL ? [scope.taluka] : talukasFor(scope.district);

const scopeParty = (scope: DashboardScope): string | null =>
  scope.role === "PARTY" ? PROTOTYPE_PARTY : scope.organisation !== ALL ? scope.organisation : null;

/** Share of statewide volume covered by the scope (for the synthetic daily series). */
function volumeShare(scope: DashboardScope, talukas = scopeTalukas(scope)): number {
  const talukaShare = talukas.reduce((sum, taluka) => sum + (TALUKA_SHARE[taluka] ?? 0), 0);
  const party = scopeParty(scope);
  const partyShare = party ? (ORG_WEIGHTS[ORGANISATIONS.indexOf(party)] ?? 1) / ORG_TOTAL : 1;
  return talukaShare * partyShare;
}

const inScope = (record: RegisterRecord, scope: DashboardScope, talukas = scopeTalukas(scope)) => {
  const party = scopeParty(scope);
  return talukas.includes(record.taluka) && (!party || record.party === party);
};

/* ---------- Synthetic daily series (dispatch, revenue) ---------- */

/**
 * Goa's mining season runs October–May; the monsoon (June–September) halts
 * extraction, leaving only stock movement.
 */
function seasonFactor(iso: string): number {
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (month >= 6 && month <= 9) return 0.06;
  if (month === 10) return 0.35 + (0.65 * day) / 31;
  return 1;
}

function dailyDispatch(iso: string): number {
  const random = seededRandom(hashString(`dispatch:${iso}`));
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
  const weekFactor = weekday === 0 ? 0.35 : weekday === 6 ? 0.8 : 1;
  return 6800 * seasonFactor(iso) * weekFactor * (0.85 + random() * 0.3);
}

const REVENUE_PER_MT = 551;

function dailyRevenue(iso: string): number {
  const random = seededRandom(hashString(`revenue:${iso}`));
  return dailyDispatch(iso) * REVENUE_PER_MT * (0.92 + random() * 0.16);
}

const isLateBatchDay = (iso: string, latest: string) => iso === latest || hashString(`late:${iso}`) % 17 === 0;

const sumDays = (from: string, to: string, value: (iso: string) => number) => {
  let total = 0;
  for (let day = from; day <= to; day = addDays(day, 1)) total += value(day);
  return total;
};

/* ---------- Windows ---------- */

function windowFor(scope: DashboardScope): { from: string; to: string } {
  const to = scope.asOfDate;
  switch (scope.period) {
    case "T1":
      return { from: to, to };
    case "7D":
      return { from: addDays(to, -6), to };
    case "30D":
      return { from: addDays(to, -29), to };
    case "MTD":
      return { from: monthStart(to), to };
    case "FY":
      return { from: financialYearStart(to), to };
    case "RANGE": {
      const rangeTo = scope.rangeTo > to ? to : scope.rangeTo;
      return { from: scope.rangeFrom > rangeTo ? rangeTo : scope.rangeFrom, to: rangeTo };
    }
  }
}

const COMPARE_SHIFT: Record<ComparePeriod, number> = { "D-1": 1, "W-1": 7, "M-1": 30 };

const pctChange = (current: number, previous: number) =>
  previous ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;

/* ---------- Record predicates ---------- */

const OPEN_STATUSES: WorkflowStatus[] = ["Draft", "Submitted", "Pending"];
const openDiscrepancies = (record: RegisterRecord) =>
  record.discrepancies.filter((item) => item.status === "Open" || item.status === "Under review");

const isExpiringWithin = (record: RegisterRecord, asOf: string, days: number) =>
  record.type === "permit" &&
  record.status === "Approved" &&
  !!record.validUpto &&
  record.validUpto > asOf &&
  daysBetween(asOf, record.validUpto) <= days;

/** Review queues a record belongs to on the as-of date. */
export function queuesFor(record: RegisterRecord, asOf: string): string[] {
  const queues: string[] = [];
  const open = OPEN_STATUSES.includes(record.status);
  if (open && record.type === "permit") queues.push("Permit approvals");
  if (open && record.type === "stock") queues.push("Stock lot verification");
  if (record.type === "tripsheet" && record.status === "Pending") queues.push("Open tripsheets");
  if (record.type === "challan" && record.status === "Pending") queues.push("Unpaid e-Challans");
  if (openDiscrepancies(record).length > 0) queues.push("Discrepancies");
  if (isExpiringWithin(record, asOf, 7)) queues.push("Expiring permits");
  return queues;
}

export const isOpenItem = (record: RegisterRecord, asOf: string) => queuesFor(record, asOf).length > 0;

/** Records as they stood on `asOf` (the prototype keeps one universe and ages it back). */
function recordsAsOf(asOf: string, latest: string): RegisterRecord[] {
  const shift = daysBetween(asOf, latest);
  return getUniverse(latest)
    .filter((record) => record.date <= asOf)
    .map((record) =>
      shift === 0
        ? { ...record }
        : {
            ...record,
            ageDays: Math.max(0, record.ageDays - shift),
            discrepancies: record.discrepancies.filter((item) => item.raisedOn <= asOf),
            recon: record.recon.state === "provisional" ? { ...record.recon, state: "reconciled" } : record.recon,
          }
    );
}

/* ---------- Snapshot ---------- */

const bucketFor = (days: number): AgeBucket =>
  days <= 2 ? "0–2 d" : days <= 7 ? "3–7 d" : days <= 15 ? "8–15 d" : ">15 d";

function ageingRow(queue: string, slaDays: number, ages: number[]): AgeingRow {
  const buckets = Object.fromEntries(AGE_BUCKETS.map((bucket) => [bucket, 0])) as Record<AgeBucket, number>;
  ages.forEach((age) => (buckets[bucketFor(age)] += 1));
  return { queue, slaDays, buckets, breaches: ages.filter((age) => age > slaDays).length };
}

const signOffs = new Map<string, SignOffRow>();

const JURISDICTION_OFFICERS: Record<string, { officer: string; designation: string }> = {
  Bicholim: { officer: "Shri A. Desai", designation: "Mines Inspector" },
  Sattari: { officer: "Shri V. Parab", designation: "Assistant Geologist" },
  Sanguem: { officer: "Shri S. Gaude", designation: "Mines Inspector" },
  Dharbandora: { officer: "Smt. L. Velip", designation: "Mines Inspector" },
  Quepem: { officer: "Shri M. Fernandes", designation: "Assistant Geologist" },
};

function signOffRow(asOf: string, latest: string, taluka: string, openItems: number): SignOffRow {
  const key = `${asOf}:${taluka}`;
  const stored = signOffs.get(key);
  if (stored) return { ...stored, openItems };

  const random = seededRandom(hashString(key));
  const signed = random() < (asOf === latest ? 0.4 : 0.92);
  const assignee = JURISDICTION_OFFICERS[taluka]!;
  const row: SignOffRow = {
    key,
    jurisdiction: taluka,
    officer: assignee.officer,
    designation: assignee.designation,
    state: signed ? "Signed off" : "Pending",
    signedAt: signed ? `${addDays(asOf, 1)}T${String(9 + Math.floor(random() * 3)).padStart(2, "0")}:${String(Math.floor(random() * 60)).padStart(2, "0")}:00+05:30` : undefined,
    remark: signed ? "T-1 figures reviewed; exceptions noted in register." : undefined,
    openItems,
  };
  signOffs.set(key, row);
  return row;
}

export function buildSnapshot(scope: DashboardScope, now = new Date()): GovernanceSnapshot {
  const latest = latestT1(now);
  const asOf = scope.asOfDate > latest ? latest : scope.asOfDate;
  const talukas = scopeTalukas(scope);
  const share = volumeShare(scope, talukas);
  const window = windowFor({ ...scope, asOfDate: asOf });
  const shift = COMPARE_SHIFT[scope.compare];
  const days = daysBetween(window.from, window.to) + 1;

  const all = recordsAsOf(asOf, latest)
    .filter((record) => inScope(record, scope, talukas))
    .map((record) => ({ ...record, queues: queuesFor(record, asOf) }));
  const records = all.filter((record) => record.date >= window.from || isOpenItem(record, asOf));

  const dispatch = (iso: string) => dailyDispatch(iso) * share;
  const revenue = (iso: string) => dailyRevenue(iso) * share;
  const permitsOn = (iso: string) => all.filter((record) => record.type === "permit" && record.date === iso && record.status !== "Draft").length;

  /* KPIs */
  const windowSum = (value: (iso: string) => number, offset = 0) =>
    sumDays(addDays(window.from, -offset), addDays(window.to, -offset), value);
  const spark = (value: (iso: string) => number) =>
    Array.from({ length: 12 }, (_, index) => value(addDays(asOf, index - 11)));
  // The T-1 day against the mean of the 7 days before it, whatever the window.
  const vsBaseline = (value: (iso: string) => number) =>
    pctChange(value(asOf), sumDays(addDays(asOf, -7), addDays(asOf, -1), value) / 7);

  const flowKpi = (value: (iso: string) => number, target?: number): KpiValue => {
    const total = windowSum(value);
    return {
      value: Math.round(total),
      delta: pctChange(total, windowSum(value, shift)),
      vsBaseline: vsBaseline(value),
      spark: spark(value),
      target,
    };
  };

  const pendingOver7 = (on: string) =>
    all.filter(
      (record) =>
        record.type === "permit" &&
        OPEN_STATUSES.includes(record.status) &&
        record.date <= on &&
        record.ageDays - daysBetween(on, asOf) > 7
    ).length;
  const openDiscrepancyCount = (on: string) =>
    all.reduce((sum, record) => sum + openDiscrepancies(record).filter((item) => item.raisedOn <= on).length, 0);
  const expiring = (on: string) => all.filter((record) => isExpiringWithin(record, on, 7)).length;

  const countKpi = (value: (on: string) => number): KpiValue => {
    const current = value(asOf);
    return {
      value: current,
      delta: pctChange(current, value(addDays(asOf, -shift))),
      vsBaseline: pctChange(current, sumDays(addDays(asOf, -7), addDays(asOf, -1), value) / 7),
      spark: spark(value),
    };
  };

  // Notified collection target: ₹10.5 Cr a month statewide in season,
  // pro-rated to the scope, the window and the season.
  const revenueTarget = Math.round((105_000_000 * share * sumDays(window.from, window.to, seasonFactor)) / 30);

  const kpis: Record<KpiId, KpiValue> = {
    revenue: flowKpi(revenue, revenueTarget),
    dispatch: flowKpi(dispatch),
    permits: flowKpi(permitsOn),
    pending: countKpi(pendingOver7),
    discrepancies: countKpi(openDiscrepancyCount),
    expiring: countKpi(expiring),
  };

  /* Trends: daily for up to 92 days, monthly beyond (FY). */
  const trendWindowFrom = scope.period === "T1" || days < 14 ? addDays(asOf, -29) : window.from;
  const trendDays = daysBetween(trendWindowFrom, asOf) + 1;
  const series = (value: (iso: string) => number): BaselinePoint[] => {
    if (trendDays > 92) {
      const months: BaselinePoint[] = [];
      for (let start = monthStart(trendWindowFrom); start <= asOf; start = monthStart(addDays(start, 32))) {
        const end = addDays(monthStart(addDays(start, 32)), -1);
        const to = end > asOf ? asOf : end;
        const total = sumDays(start, to, value);
        months.push({
          date: start,
          label: new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(new Date(`${start}T00:00:00Z`)),
          actual: Math.round(total),
          baseline: 0,
          lateBatch: false,
        });
      }
      months.forEach((point, index) => {
        const previous = months.slice(Math.max(0, index - 3), index);
        point.baseline = previous.length
          ? Math.round(previous.reduce((sum, item) => sum + item.actual, 0) / previous.length)
          : point.actual;
      });
      return months;
    }

    const points: BaselinePoint[] = [];
    for (let day = trendWindowFrom; day <= asOf; day = addDays(day, 1)) {
      points.push({
        date: day,
        label: formatDayMonth(day),
        actual: Math.round(value(day)),
        baseline: Math.round(sumDays(addDays(day, -7), addDays(day, -1), value) / 7),
        lateBatch: isLateBatchDay(day, latest) && (day !== latest || asOf === latest),
      });
    }
    return points;
  };

  const trends: Record<TrendMetric, BaselinePoint[]> = {
    dispatch: series(dispatch),
    revenue: series(revenue),
    permits: series(permitsOn),
  };

  /* Permit status by type */
  const permitRecords = records.filter((record) => record.type === "permit");
  const statusBreakdown: StatusBreakdownRow[] = ["Import permit", "Export permit", "Transit permit", "Sale permit"].map(
    (label) => {
      const counts: StatusBreakdownRow["counts"] = {};
      permitRecords
        .filter((record) => record.subtype === label)
        .forEach((record) => (counts[record.status] = (counts[record.status] ?? 0) + 1));
      return { label, counts };
    }
  );

  /* Jurisdiction rollup */
  const rollupFor = (name: string, level: RollupRow["level"], rowTalukas: string[], parent?: string): RollupRow => {
    const rowShare = volumeShare(scope, rowTalukas);
    const rowRecords = all.filter((record) => rowTalukas.includes(record.taluka));
    const rowDispatch = (iso: string) => dailyDispatch(iso) * rowShare;
    const dispatchTotal = windowSum(rowDispatch);
    return {
      key: `${level}:${name}`,
      name,
      level,
      parent,
      dispatch: Math.round(dispatchTotal),
      revenue: Math.round(windowSum((iso) => dailyRevenue(iso) * rowShare)),
      permits: rowRecords.filter((record) => record.type === "permit" && record.date >= window.from && record.status !== "Draft").length,
      pending: rowRecords.filter((record) => OPEN_STATUSES.includes(record.status)).length,
      discrepancies: rowRecords.reduce((sum, record) => sum + openDiscrepancies(record).length, 0),
      dispatchDelta: pctChange(dispatchTotal, windowSum(rowDispatch, shift)),
      trend: spark(rowDispatch),
    };
  };

  const rollup: RollupRow[] = [];
  Object.entries(TALUKAS_BY_DISTRICT).forEach(([district, districtTalukas]) => {
    const visible = districtTalukas.filter((taluka) => talukas.includes(taluka));
    if (visible.length === 0) return;
    rollup.push(rollupFor(district, "district", visible));
    visible.forEach((taluka) => rollup.push(rollupFor(taluka, "taluka", [taluka], district)));
  });

  /* Ageing */
  const ages = (predicate: (record: RegisterRecord) => boolean) =>
    all.filter(predicate).map((record) => record.ageDays);
  const ageing: AgeingRow[] = [
    ageingRow("Permit approvals", 7, ages((record) => record.type === "permit" && OPEN_STATUSES.includes(record.status))),
    ageingRow("Stock lot verification", 10, ages((record) => record.type === "stock" && OPEN_STATUSES.includes(record.status))),
    ageingRow("Open tripsheets", 2, ages((record) => record.type === "tripsheet" && record.status === "Pending")),
    ageingRow("Unpaid e-Challans", 15, ages((record) => record.type === "challan" && record.status === "Pending")),
    ageingRow(
      "Discrepancies",
      7,
      all.flatMap((record) => openDiscrepancies(record).map((item) => Math.max(0, daysBetween(item.raisedOn, asOf))))
    ),
  ];

  /* Sign-off */
  const signOff = talukas.map((taluka) =>
    signOffRow(
      asOf,
      latest,
      taluka,
      all.filter((record) => record.taluka === taluka && isOpenItem(record, asOf)).length
    )
  );

  return {
    asOf: {
      asOfDate: asOf,
      latestDate: latest,
      cutoff: "23:59 IST",
      batchId: `BHU-T1-${asOf.replace(/-/g, "")}`,
      batchSyncedAt: new Date(`${addDays(asOf, 1)}T02:14:00+05:30`).toISOString(),
      sources: batchSources(asOf, latest),
    },
    kpis,
    trends,
    statusBreakdown,
    rollup,
    ageing,
    records,
    signOff,
  };
}

/* ---------- Actions ---------- */

let ackSequence = 4100;
const ackNo = (kind: string) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ACK/${kind}/${date}/${++ackSequence}`;
};

const nowIso = () => new Date().toISOString();

const findRecord = (recordId: string) => {
  const record = getUniverse(latestT1()).find((item) => item.id === recordId);
  if (!record) throw new Error("Record not found");
  return record;
};

const log = (record: RegisterRecord, officer: Officer, action: string, remark: string, ack: string) => {
  const entry: AuditEntry = { at: nowIso(), by: officer.name, designation: officer.designation, action, remark, ackNo: ack };
  record.audit = [...record.audit, entry];
};

export const governanceActions = {
  markReviewed(recordId: string, remark: string, officer: Officer): ActionResult {
    const record = findRecord(recordId);
    const ack = ackNo("REV");
    record.reviewed = { by: officer.name, designation: officer.designation, at: nowIso(), remark };
    log(record, officer, "Marked reviewed", remark, ack);
    return { ackNo: ack };
  },

  flagDiscrepancy(
    recordId: string,
    input: { rule: string; severity: Severity; remark: string },
    officer: Officer
  ): ActionResult {
    const record = findRecord(recordId);
    const ack = ackNo("DSC");
    record.discrepancies = [
      ...record.discrepancies,
      {
        id: `${recordId}-m${record.discrepancies.length + 1}`,
        rule: input.rule,
        severity: input.severity,
        detail: input.remark,
        status: "Open",
        raisedOn: latestT1(),
      },
    ];
    log(record, officer, `Discrepancy flagged: ${input.rule}`, input.remark, ack);
    return { ackNo: ack };
  },

  updateDiscrepancy(
    recordId: string,
    discrepancyId: string,
    status: "Under review" | "Resolved" | "Justified",
    remark: string,
    officer: Officer
  ): ActionResult {
    const record = findRecord(recordId);
    const ack = ackNo("DSC");
    record.discrepancies = record.discrepancies.map((item) =>
      item.id === discrepancyId ? { ...item, status } : item
    );
    const rule = record.discrepancies.find((item) => item.id === discrepancyId)?.rule ?? "Discrepancy";
    log(record, officer, `${rule} → ${status}`, remark, ack);
    return { ackNo: ack };
  },

  signOff(key: string, remark: string, officer: Officer): ActionResult {
    const existing = signOffs.get(key);
    if (!existing) throw new Error("Jurisdiction not found");
    signOffs.set(key, {
      ...existing,
      state: "Signed off",
      officer: officer.name,
      designation: officer.designation,
      signedAt: nowIso(),
      remark,
    });
    return { ackNo: ackNo("SGN") };
  },

  /** Exports are logged centrally so the department can see who exported what. */
  logExport(report: string, format: "PDF" | "Excel", officer: Officer, recordId?: string): ActionResult {
    const ack = ackNo("EXP");
    if (recordId) log(findRecord(recordId), officer, `Exported ${report} (${format})`, "", ack);
    return { ackNo: ack };
  },
};
