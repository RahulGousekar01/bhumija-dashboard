import type { AlertActivityData, CountMetric, MasterDataMetric } from "../../types/dashboard";

export const masterDataEntities: MasterDataMetric[] = [
  {
    id: "parties",
    title: "Registered Parties",
    count: 428,
    label: "Registered organisations",
    details: [
      { label: "Active", count: 391 },
      { label: "Inactive", count: 21 },
      { label: "Pending Verification", count: 16 },
    ],
  },
  {
    id: "trucks",
    title: "Registered Trucks",
    count: 1842,
    label: "Registered vehicles",
    details: [
      { label: "Active", count: 1624 },
      { label: "Inactive", count: 142 },
      { label: "Under Maintenance", count: 76 },
    ],
  },
  {
    id: "barges",
    title: "Registered Barges",
    count: 126,
    label: "Registered barges",
    details: [
      { label: "Active", count: 108 },
      { label: "Inactive", count: 12 },
      { label: "Under Maintenance", count: 6 },
    ],
  },
  {
    id: "locations",
    title: "Locations",
    count: 86,
    label: "Registered locations",
    details: [
      { label: "Active", count: 79 },
      { label: "Inactive", count: 7 },
    ],
  },
  {
    id: "weighbridges",
    title: "Weighbridges",
    count: 34,
    label: "Registered weighbridges",
    details: [
      { label: "Operational", count: 30 },
      { label: "Offline", count: 2 },
      { label: "Under Maintenance", count: 2 },
    ],
  },
  {
    id: "yards",
    title: "Yards",
    count: 52,
    label: "Registered yards",
    details: [
      { label: "Active", count: 46 },
      { label: "Inactive", count: 6 },
    ],
  },
  {
    id: "processingUnits",
    title: "Processing Units",
    count: 41,
    label: "Registered units",
    details: [
      { label: "Operational", count: 36 },
      { label: "Inactive", count: 3 },
      { label: "Under Maintenance", count: 2 },
    ],
  },
  {
    id: "routes",
    title: "Routes",
    count: 138,
    label: "Registered routes",
    details: [
      { label: "Active", count: 124 },
      { label: "Inactive", count: 14 },
    ],
  },
];

export const violations: Record<"all" | "own", CountMetric> = {
  all: {
    id: "violations",
    title: "Violations",
    count: 47,
    label: "Recorded violations",
    details: [
      { label: "Device Tampering", count: 8 },
      { label: "User Blocked", count: 5 },
      { label: "Overspeeding", count: 26 },
      { label: "Expired Permit with Stock", count: 8 },
    ],
  },
  own: {
    id: "violations",
    title: "Violations",
    count: 6,
    label: "Your recorded violations",
    details: [
      { label: "Device Tampering", count: 1 },
      { label: "User Blocked", count: 1 },
      { label: "Overspeeding", count: 3 },
      { label: "Expired Permit with Stock", count: 1 },
    ],
  },
};

export const alertActivity: AlertActivityData = {
  alerts: [
    {
      id: "a1",
      severity: "critical",
      title: "Permit nearing expiry",
      description: "3 permits are due to expire within 7 days.",
      time: "12 min ago",
    },
    {
      id: "a2",
      severity: "warning",
      title: "Tripsheet exception",
      description: "2 tripsheets require operator attention.",
      time: "28 min ago",
    },
    {
      id: "a3",
      severity: "warning",
      title: "Stock threshold reached",
      description: "Low balance detected at Bicholim location.",
      time: "1 hr ago",
    },
    {
      id: "a4",
      severity: "info",
      title: "Payment pending",
      description: "Royalty payment requires verification.",
      time: "2 hrs ago",
    },
    {
      id: "a5",
      severity: "critical",
      title: "Compliance review",
      description: "1 entity has an outstanding compliance action.",
      time: "3 hrs ago",
    },
  ],
  activities: [
    {
      id: "e1",
      type: "permit",
      title: "Permit generated",
      description: "Road permit generated successfully.",
      time: "10 min ago",
    },
    {
      id: "e2",
      type: "trip",
      title: "Tripsheet approved",
      description: "Tripsheet TS-10482 was approved.",
      time: "24 min ago",
    },
    {
      id: "e3",
      type: "weighbridge",
      title: "Vehicle weighed",
      description: "Vehicle KA-01-AB-4821 completed weighing.",
      time: "41 min ago",
    },
    {
      id: "e4",
      type: "processing",
      title: "Stock processed",
      description: "2,450 MT processed into lumps.",
      time: "1 hr ago",
    },
    {
      id: "e5",
      type: "payment",
      title: "Royalty payment recorded",
      description: "Royalty payment was successfully recorded.",
      time: "2 hrs ago",
    },
  ],
};
