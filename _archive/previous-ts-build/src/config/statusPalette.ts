import type { WorkflowStatus } from "../types/governance";

export interface StatusColor {
  /** Pill background. */
  bg: string;
  /** Text colour; chosen to pass WCAG AA on bg. */
  fg: string;
  /** Solid colour for charts and markers. */
  solid: string;
}

export type StatusColors = Record<WorkflowStatus, StatusColor>;

/*
 * The portal's standard status palette (DashboardCountData / bhumijaColorView:
 * DRAFT #2F75B5, SUBMITTED #7B7B7B, REJECTED #C65911, PENDING #FFC000,
 * APPROVED #00B050) with darker text shades so the pills stay readable.
 * When embedded, the provider's `statusColors` prop overrides these with the
 * live values from bhumijaColorView.
 */
export const DEFAULT_STATUS_COLORS: StatusColors = {
  Draft: { bg: "#DDEBF7", fg: "#1F4E79", solid: "#2F75B5" },
  Submitted: { bg: "#E7E6E6", fg: "#3A3A3A", solid: "#7B7B7B" },
  Pending: { bg: "#FFF2CC", fg: "#7F6000", solid: "#FFC000" },
  Approved: { bg: "#E2EFDA", fg: "#375623", solid: "#00B050" },
  Rejected: { bg: "#FCE4D6", fg: "#843C0C", solid: "#C65911" },
  Expired: { bg: "#F2F2F2", fg: "#595959", solid: "#A6A6A6" },
  Closed: { bg: "#E2EFDA", fg: "#375623", solid: "#70AD47" },
  Paid: { bg: "#E2EFDA", fg: "#375623", solid: "#00B050" },
};

/** Status order for legends and stacked charts: workflow order. */
export const STATUS_ORDER: WorkflowStatus[] = [
  "Draft",
  "Submitted",
  "Pending",
  "Approved",
  "Rejected",
  "Expired",
  "Closed",
  "Paid",
];
