import { ORGANISATIONS, TALUKAS_BY_DISTRICT, districtOf } from "../../config/filterOptions";
import { addDays, daysBetween, formatDate } from "../../lib/dates";
import { between, hashString, intBetween, pick, seededRandom, weighted, type Random } from "../../lib/random";
import type {
  AuditEntry,
  DataSource,
  Discrepancy,
  FeeLine,
  RegisterRecord,
  Reconciliation,
  RecordType,
  Severity,
  WorkflowStatus,
} from "../../types/governance";

/*
 * Prototype register. A deterministic universe of permits, tripsheets,
 * e-challans and stock lots for the 60 days to the latest T-1 date.
 * Records are mutable in memory so review / flag actions persist for the
 * session, as they would on the server.
 */

const LOCATIONS: Record<string, string[]> = {
  Bicholim: ["Sirigao", "Maina", "Mulgao"],
  Sattari: ["Sonshi", "Honda", "Pissurlem"],
  Sanguem: ["Rivona", "Colomb", "Netorlim"],
  Dharbandora: ["Codli", "Sacordem", "Kirlapal"],
  Quepem: ["Cavorem", "Barcem", "Xelvona"],
};

/** Weighbridges per taluka; WB-14 and WB-27 feed late on the latest batch. */
const WEIGHBRIDGES: Record<string, string[]> = {
  Bicholim: ["WB-03 Sirigao", "WB-05 Maina", "WB-08 Mulgao"],
  Sattari: ["WB-10 Sonshi", "WB-11 Honda"],
  Sanguem: ["WB-19 Rivona", "WB-21 Colomb"],
  Dharbandora: ["WB-14 Codli", "WB-16 Sacordem"],
  Quepem: ["WB-27 Cavorem", "WB-29 Barcem"],
};

export const LATE_WEIGHBRIDGES = ["WB-14 Codli", "WB-27 Cavorem"];

const GRADE_SLABS = ["Below 55% Fe", "55–58% Fe", "58–60% Fe", "60–62% Fe", "62% Fe & above"];

const OFFICERS = [
  { name: "Shri A. Desai", designation: "Mines Inspector" },
  { name: "Shri R. Naik", designation: "Assistant Director (Mines)" },
  { name: "Smt. P. Gaonkar", designation: "Deputy Director (Mines)" },
  { name: "Shri V. Parab", designation: "Assistant Geologist" },
];

const PERMIT_TYPES = [
  { code: "IMP", subtype: "Import permit" },
  { code: "EXP", subtype: "Export permit" },
  { code: "TRN", subtype: "Transit permit" },
  { code: "SAL", subtype: "Sale permit" },
] as const;

const ROYALTY_PER_MT = 452;

const pad = (value: number, size: number) => String(value).padStart(size, "0");

const vehicleNo = (random: Random) =>
  `GA-${pad(intBetween(random, 1, 12), 2)}-${pick(random, ["T", "U", "W"])}-${pad(intBetween(random, 1000, 9999), 4)}`;

const severityFor = (variancePct: number): Severity =>
  variancePct >= 5 ? "high" : variancePct >= 2.5 ? "medium" : "low";

function reconcile(sources: { label: string; quantity: number }[], pendingSource?: string): Reconciliation {
  if (pendingSource) {
    return { state: "provisional", variancePct: 0, sources, pendingSource };
  }
  const base = sources[0]?.quantity ?? 0;
  const variancePct = base
    ? Math.max(...sources.map((source) => Math.abs(source.quantity - base) / base)) * 100
    : 0;
  const rounded = Math.round(variancePct * 10) / 10;
  return { state: rounded >= 1 ? "variance" : "reconciled", variancePct: rounded, sources };
}

function feesFor(quantity: number): FeeLine[] {
  const royalty = Math.round(quantity * ROYALTY_PER_MT);
  return [
    { head: "Royalty", amount: royalty },
    { head: "DMF (10% of royalty)", amount: Math.round(royalty * 0.1) },
    { head: "NMET (2% of royalty)", amount: Math.round(royalty * 0.02) },
    { head: "GIOPF", amount: Math.round(quantity * 45) },
  ];
}

interface Workflow {
  status: WorkflowStatus;
  statusDate: string;
  audit: AuditEntry[];
}

/** Builds a plausible approval history ending in `status`. */
function workflow(random: Random, type: RecordType, date: string, latest: string, party: string): Workflow {
  const officer = pick(random, OFFICERS);
  const approver = OFFICERS[2]!;
  const entry = (offset: number, by: string, designation: string, action: string, remark?: string): AuditEntry => ({
    at: `${addDays(date, offset)}T${pad(intBetween(random, 9, 18), 2)}:${pad(intBetween(random, 0, 59), 2)}:00+05:30`,
    by,
    designation,
    action,
    remark,
  });

  const age = daysBetween(date, latest);
  const audit: AuditEntry[] = [entry(0, party, "Applicant", "Created", undefined)];

  if (type === "tripsheet") {
    const closed = age > 1 && random() > 0.12;
    audit.push(entry(0, "System", "Weighbridge", "Source weighment recorded"));
    if (closed) {
      audit.push(entry(Math.min(1, age), "System", "Weighbridge", "Destination weighment recorded; trip closed"));
      return { status: "Closed", statusDate: addDays(date, Math.min(1, age)), audit };
    }
    return { status: "Pending", statusDate: date, audit };
  }

  if (type === "challan") {
    const paid = random() > 0.18;
    audit.push(entry(0, party, "Applicant", "e-Challan generated"));
    if (paid) {
      const paidOn = Math.min(age, intBetween(random, 0, 2));
      audit.push(entry(paidOn, "Treasury", "e-Challan gateway", "Payment confirmed", undefined));
      return { status: "Paid", statusDate: addDays(date, paidOn), audit };
    }
    return { status: "Pending", statusDate: date, audit };
  }

  // Permits and stock lots go through the approval workflow.
  audit.push(entry(0, party, "Applicant", "Submitted"));
  const stage = weighted(random, [
    ["Approved", age > 3 ? 6 : 1],
    ["Pending", 3],
    ["Submitted", 2],
    ["Rejected", 0.6],
    ["Draft", 0.4],
  ] as const);

  if (stage === "Draft") return { status: "Draft", statusDate: date, audit: audit.slice(0, 1) };
  if (stage === "Submitted") return { status: "Submitted", statusDate: date, audit };

  const forwardDay = Math.min(age, intBetween(random, 1, 3));
  audit.push(entry(forwardDay, officer.name, officer.designation, "Verified and forwarded", "Documents verified against lease records."));
  if (stage === "Pending") return { status: "Pending", statusDate: addDays(date, forwardDay), audit };

  const decisionDay = Math.min(age, forwardDay + intBetween(random, 1, 4));
  if (stage === "Rejected") {
    audit.push(entry(decisionDay, approver.name, approver.designation, "Rejected", "Quantity exceeds approved mining plan for the block."));
    return { status: "Rejected", statusDate: addDays(date, decisionDay), audit };
  }
  audit.push(entry(decisionDay, approver.name, approver.designation, "Approved"));
  return { status: "Approved", statusDate: addDays(date, decisionDay), audit };
}

function makeDiscrepancy(
  random: Random,
  id: string,
  rule: string,
  detail: string,
  severity: Severity,
  raisedOn: string
): Discrepancy {
  return {
    id,
    rule,
    severity,
    detail,
    raisedOn,
    status: weighted(random, [
      ["Open", 6],
      ["Under review", 3],
      ["Resolved", 1.5],
      ["Justified", 0.8],
    ] as const),
  };
}

const universes = new Map<string, RegisterRecord[]>();

/** The full register for the latest T-1 date (built once, then mutated by actions). */
export function getUniverse(latest: string): RegisterRecord[] {
  const cached = universes.get(latest);
  if (cached) return cached;

  const random = seededRandom(hashString(`register:${latest}`));
  const talukas = Object.values(TALUKAS_BY_DISTRICT).flat();
  const records: RegisterRecord[] = [];
  const counts = { permit: 92, tripsheet: 120, challan: 48, stock: 26 } as const;
  let sequence = 1000;

  (Object.keys(counts) as RecordType[]).forEach((type) => {
    for (let index = 0; index < counts[type]; index++) {
      const taluka = pick(random, talukas);
      const party = weighted(random, ORGANISATIONS.map((name, rank) => [name, 6 - rank] as const));
      const date = addDays(latest, -Math.floor(Math.pow(random(), 1.4) * 58));
      const location = pick(random, LOCATIONS[taluka]!);
      const oreForm = weighted(random, [["Lumps", 4], ["Fines", 5], ["ROM", 1.5]] as const);
      const gradeSlab = pick(random, GRADE_SLABS);
      const flow = workflow(random, type, date, latest, party);
      const id = `${type}-${++sequence}`;
      const yy = date.slice(2, 4);
      const discrepancies: Discrepancy[] = [];

      let refNo: string;
      let subtype: string;
      let quantity: number;
      let validUpto: string | undefined;
      let vehicle: string | undefined;
      let weighbridge: string | undefined;
      let fees: FeeLine[] | undefined;
      let recon: Reconciliation;

      if (type === "permit") {
        const permit = pick(random, PERMIT_TYPES);
        subtype = permit.subtype;
        refNo = `DMG/${permit.code}/20${yy}/${pad(sequence, 5)}`;
        quantity = Math.round(between(random, 800, 12000) / 50) * 50;
        validUpto = addDays(date, intBetween(random, 20, 45));
        const dispatched = Math.round(quantity * between(random, 0.35, 1.06));
        recon = reconcile([
          { label: "Permitted quantity", quantity },
          { label: "Dispatched against permit (ILMS)", quantity: Math.min(dispatched, Math.round(quantity * 1.06)) },
        ]);
        // Under-dispatch is normal; only over-dispatch is a variance.
        if (dispatched <= quantity) recon = { ...recon, state: "reconciled", variancePct: 0 };
        if (dispatched > quantity) {
          discrepancies.push(
            makeDiscrepancy(
              random,
              `${id}-d1`,
              "Dispatch exceeds permitted quantity",
              `${(dispatched - quantity).toLocaleString("en-IN")} MT dispatched beyond the permit.`,
              severityFor(((dispatched - quantity) / quantity) * 100),
              addDays(date, 2) > latest ? latest : addDays(date, 2)
            )
          );
        }
        if (flow.status === "Approved" && validUpto < latest && random() > 0.55) {
          flow.status = "Expired";
          discrepancies.push(
            makeDiscrepancy(
              random,
              `${id}-d2`,
              "Expired permit with balance stock",
              `Permit expired on ${formatDate(validUpto)} with ${Math.max(
                Math.round(quantity * 0.08),
                quantity - dispatched
              ).toLocaleString("en-IN")} MT undispatched.`,
              "medium",
              addDays(validUpto, 1)
            )
          );
        }
      } else if (type === "tripsheet") {
        const road = random() > 0.2;
        subtype = road ? "Road tripsheet" : "Barge tripsheet";
        refNo = `TP${yy}${pad(sequence * 37 + intBetween(random, 0, 36), 6)}`;
        quantity = road ? Math.round(between(random, 18, 32) * 1000) / 1000 : Math.round(between(random, 900, 2600));
        vehicle = road ? vehicleNo(random) : `MV ${pick(random, ["Mandovi", "Zuari", "Sal", "Chapora"])}-${intBetween(random, 2, 19)}`;
        weighbridge = pick(random, WEIGHBRIDGES[taluka]!);
        const destination = quantity * (1 - weighted(random, [[between(random, 0, 0.008), 8], [between(random, 0.02, 0.07), 1.2]] as const));
        const lateFeed = date === latest && LATE_WEIGHBRIDGES.includes(weighbridge);
        recon = reconcile(
          [
            { label: `Source weighment (${weighbridge})`, quantity },
            { label: "Destination weighment", quantity: Math.round(destination * 1000) / 1000 },
          ],
          lateFeed ? `${weighbridge} batch` : undefined
        );
        if (recon.state === "variance" && recon.variancePct >= 2) {
          discrepancies.push(
            makeDiscrepancy(
              random,
              `${id}-d1`,
              "Weighbridge variance above 2%",
              `Source and destination weights differ by ${recon.variancePct}%.`,
              severityFor(recon.variancePct),
              addDays(date, 1) > latest ? latest : addDays(date, 1)
            )
          );
        }
      } else if (type === "challan") {
        subtype = "Royalty e-Challan";
        refNo = `eCH/${yy}/${pad(sequence * 11, 6)}`;
        quantity = Math.round(between(random, 400, 9000) / 10) * 10;
        fees = feesFor(quantity);
        const dispatched = Math.round(quantity * between(random, 0.96, 1.05));
        recon = reconcile([
          { label: "Quantity paid for", quantity },
          { label: "Quantity dispatched (ILMS)", quantity: dispatched },
        ]);
        if (dispatched > quantity * 1.02) {
          discrepancies.push(
            makeDiscrepancy(
              random,
              `${id}-d1`,
              "Royalty paid below dispatched tonnage",
              `Royalty short-paid on ${(dispatched - quantity).toLocaleString("en-IN")} MT (≈ ₹${Math.round((dispatched - quantity) * ROYALTY_PER_MT).toLocaleString("en-IN")}).`,
              severityFor(((dispatched - quantity) / quantity) * 100),
              addDays(date, 2) > latest ? latest : addDays(date, 2)
            )
          );
        }
      } else {
        subtype = "Stock lot";
        refNo = `STK/${location.slice(0, 3).toUpperCase()}/${pad(sequence, 5)}`;
        quantity = Math.round(between(random, 2000, 38000) / 100) * 100;
        const physical = Math.round(quantity * between(random, 0.97, 1.02));
        recon = reconcile([
          { label: "Book stock (Bhumija)", quantity },
          { label: "Physical verification (ILMS)", quantity: physical },
        ]);
        if (recon.variancePct >= 1.5) {
          discrepancies.push(
            makeDiscrepancy(
              random,
              `${id}-d1`,
              "Book vs physical stock mismatch",
              `Physical stock differs from book stock by ${recon.variancePct}%.`,
              severityFor(recon.variancePct),
              addDays(date, 3) > latest ? latest : addDays(date, 3)
            )
          );
        }
      }

      const audit = [...flow.audit];
      audit.push({
        at: `${addDays(latest, 1)}T02:14:00+05:30`,
        by: "System",
        designation: "T-1 batch",
        action: recon.state === "provisional" ? `Reconciliation pending: ${recon.pendingSource}` : "Reconciled in T-1 batch",
      });
      discrepancies.forEach((discrepancy) =>
        audit.push({
          at: `${discrepancy.raisedOn}T03:00:00+05:30`,
          by: "System",
          designation: "Rule engine",
          action: `Discrepancy raised: ${discrepancy.rule}`,
        })
      );
      audit.sort((a, b) => a.at.localeCompare(b.at));

      records.push({
        id,
        refNo,
        type,
        subtype,
        party,
        district: districtOf(taluka),
        taluka,
        location,
        mineral: "Iron Ore",
        oreForm,
        gradeSlab,
        quantity,
        amount: fees ? fees.reduce((sum, fee) => sum + fee.amount, 0) : Math.round(quantity * ROYALTY_PER_MT),
        date,
        validUpto,
        status: flow.status,
        ageDays: Math.max(0, daysBetween(flow.statusDate, latest)),
        vehicle,
        weighbridge,
        fees,
        recon,
        discrepancies,
        audit,
        queues: [],
      });
    }
  });

  records.sort((a, b) => b.date.localeCompare(a.date) || a.refNo.localeCompare(b.refNo));
  universes.set(latest, records);
  return records;
}

/** Source feeds for a batch. The latest batch has two late weighbridges. */
export function batchSources(asOf: string, latest: string): DataSource[] {
  const syncedAt = (minutes: number) => {
    const at = new Date(`${addDays(asOf, 1)}T02:00:00+05:30`);
    at.setMinutes(at.getMinutes() + minutes);
    return at.toISOString();
  };
  const isLatest = asOf === latest;

  return [
    { id: "ilms", name: "ILMS (extraction & dispatch)", state: "reconciled", syncedAt: syncedAt(6), detail: "All leases reported" },
    { id: "permits", name: "Permit workflow", state: "reconciled", syncedAt: syncedAt(2), detail: "Snapshot at 23:59 IST" },
    {
      id: "weighbridge",
      name: "Weighbridge network",
      state: isLatest ? "partial" : "reconciled",
      syncedAt: syncedAt(14),
      detail: isLatest ? `32 of 34 received · ${LATE_WEIGHBRIDGES.join(", ")} pending` : "34 of 34 received",
    },
    { id: "challan", name: "Treasury e-Challan", state: "reconciled", syncedAt: syncedAt(9), detail: "Bank scroll matched" },
    { id: "eauction", name: "e-Auction lots", state: "reconciled", syncedAt: syncedAt(4), detail: "No lot movements" },
    {
      id: "vts",
      name: "Vehicle tracking (VTS)",
      state: isLatest ? "late" : "reconciled",
      syncedAt: isLatest ? null : syncedAt(22),
      detail: isLatest ? "Expected by 06:00 IST" : "Trip logs matched",
    },
  ];
}
