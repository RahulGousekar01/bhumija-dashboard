import type { RecordType, RegisterRecord, WorkflowStatus } from "../../types/governance";

export type WorkTab = "queue" | "register" | "modules" | "signoff";

/** Grid filters, lifted to the page so overview charts can set them. */
export interface RegisterFilter {
  tab: WorkTab;
  type: RecordType | "all";
  subtype: string | null;
  statuses: WorkflowStatus[];
  queue: string | null;
  discrepanciesOnly: boolean;
  provisionalOnly: boolean;
  search: string;
}

export const EMPTY_REGISTER_FILTER: RegisterFilter = {
  tab: "queue",
  type: "all",
  subtype: null,
  statuses: [],
  queue: null,
  discrepanciesOnly: false,
  provisionalOnly: false,
  search: "",
};

export const RECORD_TYPES: readonly { value: RecordType; label: string }[] = [
  { value: "permit", label: "Permits" },
  { value: "tripsheet", label: "Tripsheets" },
  { value: "challan", label: "e-Challans" },
  { value: "stock", label: "Stock lots" },
];

export const QUEUE_ORDER = [
  "Discrepancies",
  "Permit approvals",
  "Expiring permits",
  "Open tripsheets",
  "Unpaid e-Challans",
  "Stock lot verification",
];

/** SLA in days per queue, matching the ageing panel. */
export const QUEUE_SLA: Record<string, number> = {
  "Permit approvals": 7,
  "Stock lot verification": 10,
  "Open tripsheets": 2,
  "Unpaid e-Challans": 15,
  Discrepancies: 7,
  "Expiring permits": 7,
};

export const hasOpenDiscrepancy = (record: RegisterRecord) =>
  record.discrepancies.some((item) => item.status === "Open" || item.status === "Under review");

export const isOverSla = (record: RegisterRecord) =>
  record.queues.some((queue) => queue !== "Expiring permits" && record.ageDays > (QUEUE_SLA[queue] ?? Infinity));

export function applyRegisterFilter(records: RegisterRecord[], filter: RegisterFilter): RegisterRecord[] {
  const query = filter.search.trim().toLowerCase();
  return records.filter((record) => {
    if (filter.tab === "queue" && record.queues.length === 0) return false;
    if (filter.queue && !record.queues.includes(filter.queue)) return false;
    if (filter.type !== "all" && record.type !== filter.type) return false;
    if (filter.subtype && record.subtype !== filter.subtype) return false;
    if (filter.statuses.length && !filter.statuses.includes(record.status)) return false;
    if (filter.discrepanciesOnly && !hasOpenDiscrepancy(record)) return false;
    if (filter.provisionalOnly && record.recon.state !== "provisional") return false;
    if (
      query &&
      !`${record.refNo} ${record.party} ${record.subtype} ${record.taluka} ${record.location} ${record.vehicle ?? ""} ${record.status}`
        .toLowerCase()
        .includes(query)
    ) {
      return false;
    }
    return true;
  });
}
