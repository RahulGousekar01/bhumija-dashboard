import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import "./DashboardFilters.css";

const financialYears = ["2026-27", "2025-26", "2024-25"];

const organisations = [
  "ALL",
  "ABC Mining Pvt Ltd",
  "XYZ Minerals",
  "Goa Ore Industries",
];

function DashboardFilters() {
  const { roleConfig, filters, updateFilter, resetFilters, isParty } =
    useDashboard();

  return (
    <section className="dashboard-filters">
      <div className="dashboard-filter-heading">
        <div>
          <span className="filter-eyebrow">Dashboard Scope</span>

          {isParty && (
            <p className="party-scope">Showing data for your organisation</p>
          )}
        </div>

        <span className="role-badge">{roleConfig.label}</span>
      </div>

      <div className="filter-controls">
        {roleConfig.filters.financialYear && (
          <div className="filter-field">
            <label>Financial Year</label>

            <select
              value={filters.financialYear}
              onChange={(event) =>
                updateFilter("financialYear", event.target.value)
              }
            >
              {financialYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        )}

        {roleConfig.filters.organisation && (
          <div className="filter-field organisation-field">
            <label>Organisation</label>

            <select
              value={filters.organisation}
              onChange={(event) =>
                updateFilter("organisation", event.target.value)
              }
            >
              {organisations.map((organisation) => (
                <option key={organisation} value={organisation}>
                  {organisation === "ALL" ? "All Organisations" : organisation}
                </option>
              ))}
            </select>
          </div>
        )}

        <button type="button" className="filter-reset" onClick={resetFilters}>
          Reset
        </button>
      </div>
    </section>
  );
}

export default DashboardFilters;
