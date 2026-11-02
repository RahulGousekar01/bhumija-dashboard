import React, { createContext, useContext, useMemo, useState } from "react";
import { USER_ROLES, roleConfig } from "../config/roleConfig";

const DashboardContext = createContext(null);

const initialFilters = {
  financialYear: "2026-27",
  district: "ALL",
  taluka: "ALL",
  organisation: "ALL",

  permitPeriod: "TODAY",
  operationPeriod: "TODAY",
  paymentPeriod: "FY",
  stockAsOf: "2026-09-24",
};

export function DashboardProvider({ children }) {
  /*
   * Temporary role.
   *
   * Later this should come from the authenticated user/session.
   */
  const [role, setRole] = useState(USER_ROLES.SUPER_ADMIN);

  const [filters, setFilters] = useState(initialFilters);

  const config = roleConfig[role];

  const updateRole = (nextRole) => {
    setRole(nextRole);
    setFilters((current) => ({
      ...current,
      organisation: nextRole === USER_ROLES.PARTY ? "CURRENT_PARTY" : "ALL",
    }));
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
  };

  /*
   * Party is automatically scoped to itself.
   * There is intentionally no organisation selector for PARTY.
   */
  const effectiveFilters = useMemo(() => {
    if (role === USER_ROLES.PARTY) {
      return {
        ...filters,
        organisation: "CURRENT_PARTY",
      };
    }

    return filters;
  }, [filters, role]);

  const value = {
    role,
    setRole: updateRole,

    roleConfig: config,

    filters: effectiveFilters,
    updateFilter,
    resetFilters,

    isSuperAdmin: role === USER_ROLES.SUPER_ADMIN,
    isParty: role === USER_ROLES.PARTY,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }

  return context;
}
