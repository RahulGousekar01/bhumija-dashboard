import type { FilterKey, MasterDataKey, UserRole } from "../types/dashboard";
import type { Officer } from "../types/governance";

export const USER_ROLES: { readonly [R in UserRole]: R } = {
  OFFICER: "OFFICER",
  AUDITOR: "AUDITOR",
  PARTY: "PARTY",
};

export interface RoleConfig {
  label: string;
  /** Prototype identity; in the portal this comes from logincredential(). */
  user: Officer & { initials: string };
  scope: "ALL" | "OWN";
  filters: Record<FilterKey, boolean>;
  masterData: Record<MasterDataKey, boolean>;
  permissions: {
    /** Mark a record reviewed (with remark). */
    review: boolean;
    /** Raise or update a discrepancy. */
    flag: boolean;
    /** Sign off the T-1 review for a jurisdiction. */
    signOff: boolean;
    /** See the audit trail tab. */
    audit: boolean;
  };
}

const ALL_MASTER_DATA: Record<MasterDataKey, boolean> = {
  parties: true,
  trucks: true,
  barges: true,
  locations: true,
  weighbridges: true,
  yards: true,
  processingUnits: true,
  routes: true,
};

/*
 * Portal mapping (see integration README): EncParty id 1 (GEL) and 12
 * (department) → OFFICER; auditors by designation → AUDITOR; party types
 * 2 (major lessee) and 14 (minor mineral) → PARTY.
 */
export const roleConfig: Record<UserRole, RoleConfig> = {
  OFFICER: {
    label: "Department Officer",
    user: {
      name: "Shri R. Naik",
      designation: "Assistant Director (Mines)",
      office: "DMG, Panaji",
      initials: "RN",
    },
    scope: "ALL",
    filters: { financialYear: true, district: true, taluka: true, organisation: true },
    masterData: ALL_MASTER_DATA,
    permissions: { review: true, flag: true, signOff: true, audit: true },
  },

  AUDITOR: {
    label: "Auditor",
    user: {
      name: "Smt. K. Kamat",
      designation: "Internal Auditor",
      office: "Directorate of Accounts",
      initials: "KK",
    },
    scope: "ALL",
    filters: { financialYear: true, district: true, taluka: true, organisation: true },
    masterData: ALL_MASTER_DATA,
    permissions: { review: false, flag: true, signOff: false, audit: true },
  },

  PARTY: {
    label: "Lessee / Party",
    user: {
      name: "Organisation User",
      designation: "Authorised Signatory",
      office: "ABC Mining Pvt Ltd",
      initials: "AB",
    },
    scope: "OWN",
    // A party is always scoped to itself, so there is no organisation selector.
    filters: { financialYear: true, district: true, taluka: true, organisation: false },
    masterData: { ...ALL_MASTER_DATA, parties: false, weighbridges: false },
    permissions: { review: false, flag: false, signOff: false, audit: false },
  },
};

/** Party used by the mock API for the PARTY role. */
export const PROTOTYPE_PARTY = "ABC Mining Pvt Ltd";
