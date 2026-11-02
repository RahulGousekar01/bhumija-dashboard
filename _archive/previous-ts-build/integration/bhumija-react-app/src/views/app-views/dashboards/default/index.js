/*
 * Replaces the empty default dashboard view. Renders inside the portal's own
 * HeaderNav / SideNav / Footer (AppLayout), so the dashboard's standalone
 * AppShell is not used here.
 */
import React, { useEffect, useMemo, useState } from "react";
import { withRouter } from "react-router-dom";
import { DashboardPage, DashboardProvider } from "bhumija-dashboard/index.public";
import "bhumija-dashboard/styles/tokens.css";
import { bhumijaColorView } from "Api/api";
import { dashboardApi } from "Api/DashboardApi/DashboardApi";
import { logincredential, partyTypeCredential } from "encryt/base64utils";

/* ---------- Role and identity from the session ---------- */

/** EncParty id: 1 = GEL, 12 = department → officer; 2 = major lessee, 14 = minor mineral → party. */
const DEPARTMENT_PARTY_IDS = ["1", "12"];
const AUDITOR_DESIGNATIONS = /audit/i;

function sessionRole() {
  const party = partyTypeCredential("EncParty");
  const { adm_user_currDesg } = logincredential() ?? {};
  if (!party || !DEPARTMENT_PARTY_IDS.includes(String(party.id))) return "PARTY";
  return AUDITOR_DESIGNATIONS.test(adm_user_currDesg ?? "") ? "AUDITOR" : "OFFICER";
}

function sessionOfficer() {
  const credential = logincredential() ?? {};
  const party = partyTypeCredential("EncParty");
  return {
    name: credential.username || credential.reg_username || "Portal user",
    designation: credential.adm_user_currDesg || "Officer",
    office: party?.label || "Directorate of Mines & Geology",
  };
}

/* ---------- Status colours from bhumijaColorView ---------- */

const mix = (hex, target, amount) => {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift) => {
    const base = (value >> shift) & 255;
    return Math.round(base + (target - base) * amount);
  };
  return `#${[16, 8, 0].map((shift) => channel(shift).toString(16).padStart(2, "0")).join("")}`;
};

/** Server colour → pill (light tint background, dark readable text) + solid. */
const toStatusColor = (hex) =>
  hex && /^#[0-9a-f]{6}$/i.test(hex)
    ? { solid: hex, bg: mix(hex, 255, 0.82), fg: mix(hex, 0, 0.55) }
    : undefined;

const COLOR_KEYS = {
  Draft: "draf_tbckcolor",
  Submitted: "sub_mbckcolor",
  Approved: "appr_bckcolor",
  Rejected: "rej_bckcolor",
  Pending: "pend_bckcolor",
  Expired: "exp_bckcolor",
};

function useStatusColors() {
  const [colors, setColors] = useState(undefined);
  useEffect(() => {
    let active = true;
    bhumijaColorView().then((row) => {
      if (!active || !row) return;
      const mapped = Object.fromEntries(
        Object.entries(COLOR_KEYS)
          .map(([status, key]) => [status, toStatusColor(row[key])])
          .filter(([, color]) => color)
      );
      setColors(mapped);
    });
    return () => {
      active = false;
    };
  }, []);
  return colors;
}

/* ---------- View ---------- */

export const DefaultDashboard = () => {
  const role = useMemo(sessionRole, []);
  const officer = useMemo(sessionOfficer, []);
  const statusColors = useStatusColors();

  return (
    <DashboardProvider
      api={dashboardApi}
      initialRole={role}
      officer={officer}
      statusColors={statusColors}
      lockRole
    >
      <DashboardPage />
    </DashboardProvider>
  );
};

export default withRouter(DefaultDashboard);
