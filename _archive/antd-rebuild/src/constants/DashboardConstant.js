// Roles. The dashboard has exactly two.
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  PARTY: "PARTY",
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: "Super Admin",
  [ROLES.PARTY]: "Party",
};

// Header identity per role (prototype; the portal reads this from the login).
export const ROLE_USERS = {
  [ROLES.SUPER_ADMIN]: { name: "DMG Administrator", subtitle: "State Administration", initials: "SA" },
  [ROLES.PARTY]: { name: "Organisation User", subtitle: "ABC Mining Pvt Ltd", initials: "P" },
};

// Organisation a Party user belongs to (prototype).
export const CURRENT_PARTY = "ABC Mining Pvt Ltd";

export const ALL = "ALL";

// Portal date format (DD-MMM-YYYY, e.g. 27-Oct-2026).
export const DATE_FORMAT = "DD-MMM-YYYY";

export const FINANCIAL_YEARS = ["2026-27", "2025-26"];

export const DISTRICTS = {
  "North Goa": ["Bicholim", "Bardez", "Tiswadi"],
  "South Goa": ["Salcete", "Quepem"],
};

export const ORGANISATIONS = ["ABC Mining Pvt Ltd", "XYZ Minerals", "Goa Ore Industries", "Konkan Minerals"];

export const PERMIT_TYPES = ["Import", "Export", "Transit", "Sale"];

// Workflow statuses, in order.
export const PERMIT_STATUSES = ["Draft", "Submitted", "Pending", "Approved", "Rejected"];

// Portal status colours (DashboardCountData: valuebg / titleColor).
// `text` is a darker shade of the same hue so tag text stays readable.
export const STATUS_COLORS = {
  Draft: { solid: "#2F75B5", light: "#DDEBF7", text: "#1F4E79" },
  Submitted: { solid: "#7B7B7B", light: "#E7E6E6", text: "#3A3A3A" },
  Pending: { solid: "#FFC000", light: "#FFF2CC", text: "#7F6000" },
  Approved: { solid: "#00B050", light: "#E2EFDA", text: "#375623" },
  Rejected: { solid: "#C65911", light: "#FCE4D6", text: "#843C0C" },
};

// Ore source category and purpose by permit type (from the permit overview).
export const ORE_SOURCES = {
  Import: ["Dumped (Auctioned)", "Outside Goa", "Outside India", "Royalty Paid (Dump Allotted)"],
  Export: ["Dump (Auctioned)", "eAuction Lot", "Imported (For Consumption)", "Imported (For Export)", "Royalty Paid"],
  Transit: ["Dump (Auctioned)", "eAuction Lot", "Imported (For Consumption)", "Royalty Paid"],
  Sale: ["eAuction Lot", "Royalty Paid"],
};

export const PURPOSES = {
  Import: ["End Use (Consumption)", "Export"],
  Export: ["Export"],
  Transit: ["End Use (Consumption)", "Movement"],
  Sale: ["Sale"],
};

export const ORE_FORMS = ["Lumps", "Fines", "ROM"];

export const GRADE_SLABS = ["Below 55% Fe", "55% - 58% Fe", "58% - 60% Fe", "60% - 62% Fe", "62% Fe & above"];
