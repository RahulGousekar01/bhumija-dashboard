import type { CountMetric, PermitType } from "../../types/dashboard";

export const permitTypes: PermitType[] = [
  {
    id: "import",
    title: "Import",
    count: 28,
    categories: [
      { label: "Dumped (Auctioned)", count: 8 },
      { label: "Outside Goa", count: 10 },
      { label: "Outside India", count: 4 },
      { label: "Royalty Paid (Dump Allotted)", count: 6 },
    ],
    purposes: [
      { label: "End Use (Consumption)", count: 20 },
      { label: "Export", count: 8 },
    ],
  },
  {
    id: "export",
    title: "Export",
    count: 18,
    categories: [
      { label: "Dump (Auctioned)", count: 4 },
      { label: "eAuction Lot", count: 3 },
      { label: "Imported (For Consumption)", count: 2 },
      { label: "Imported (For Export)", count: 3 },
      { label: "Royalty Paid", count: 4 },
      { label: "Royalty Paid (Dump Allotted)", count: 2 },
    ],
    purposes: [{ label: "Export", count: 18 }],
  },
  {
    id: "transit",
    title: "Transit Permit",
    count: 24,
    categories: [
      { label: "Dump (Auctioned)", count: 5 },
      { label: "eAuction Lot", count: 4 },
      { label: "Imported (For Consumption)", count: 3 },
      { label: "Imported (For Export)", count: 4 },
      { label: "Royalty Paid", count: 5 },
      { label: "Royalty Paid (Dump Auction)", count: 3 },
    ],
    purposes: [
      { label: "End Use (Consumption)", count: 15 },
      { label: "Movement", count: 9 },
    ],
  },
  {
    id: "sale",
    title: "Sale Permit",
    count: 16,
    categories: [
      { label: "eAuction Lot", count: 7 },
      { label: "Royalty Paid", count: 9 },
    ],
    purposes: [{ label: "Sale", count: 16 }],
  },
];

export const operationMetrics: CountMetric[] = [
  {
    id: "active-permits",
    title: "Active Permits",
    count: 248,
    label: "Currently active",
    details: [
      { label: "Import", count: 72 },
      { label: "Export", count: 54 },
      { label: "Transit Permit", count: 86 },
      { label: "Sale Permit", count: 36 },
    ],
  },
  {
    id: "active-trips",
    title: "Active Trips",
    count: 96,
    label: "Currently in progress",
    details: [
      { label: "Awaiting Weighbridge", count: 18 },
      { label: "Weighing", count: 24 },
      { label: "Unloading", count: 32 },
      { label: "Other In Progress", count: 22 },
    ],
  },
  {
    id: "awaiting-action",
    title: "Awaiting Action",
    count: 31,
    label: "Requires attention",
    details: [
      { label: "Awaiting Approval", count: 8 },
      { label: "Awaiting Weighbridge", count: 12 },
      { label: "Awaiting Unloading", count: 7 },
      { label: "Other", count: 4 },
    ],
  },
  {
    id: "completed-trips",
    title: "Completed Trips",
    count: 1284,
    label: "Completed",
    details: [
      { label: "Today", count: 124 },
      { label: "Yesterday", count: 186 },
      { label: "Last 7 Days", count: 974 },
    ],
  },
  {
    id: "expiring-permits",
    title: "Expiring Permits",
    count: 18,
    label: "Requires attention",
    details: [
      { label: "Within 3 Days", count: 4 },
      { label: "Within 7 Days", count: 7 },
      { label: "Within 30 Days", count: 7 },
    ],
  },
  {
    id: "exceptions",
    title: "Exceptions / Issues",
    count: 7,
    label: "Open issues",
    details: [
      { label: "Tripsheet Exception", count: 3 },
      { label: "Weighbridge Issue", count: 2 },
      { label: "Permit Issue", count: 1 },
      { label: "Other", count: 1 },
    ],
  },
];
