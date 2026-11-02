/*
 * Public surface for embedding the dashboard in the Bhumija portal.
 * See integration/README.md for the step-by-step guide.
 *
 *   <DashboardProvider api={dashboardApi} initialRole={role} officer={officer} statusColors={colors} lockRole>
 *     <DashboardPage />
 *   </DashboardProvider>
 */

export { DashboardProvider, useDashboard, type CrossFilter } from "./context/DashboardContext";
export { DashboardPage } from "./pages/DashboardPage";
export { AppShell } from "./components/layout/AppShell";

export * from "./components/ui";
export { mockDashboardApi, type DashboardApi } from "./services/dashboardApi";
export { roleConfig, USER_ROLES, type RoleConfig } from "./config/roleConfig";
export { DEFAULT_STATUS_COLORS, type StatusColor, type StatusColors } from "./config/statusPalette";
export { readUrlParams, writeUrlParams, subscribeToUrl } from "./lib/urlState";
export { downloadPdf, downloadExcel, type ReportMeta, type ReportSection } from "./lib/reports/official";
export type * from "./types/dashboard";
export type * from "./types/governance";
