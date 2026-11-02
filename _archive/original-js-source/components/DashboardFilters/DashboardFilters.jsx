import React from "react";
import { useDashboard } from "../../context/DashboardContext";
import "./DashboardFilters.css";

const financialYears = ["2026-27", "2025-26", "2024-25"];

const districts = ["ALL", "North Goa", "South Goa"];

const talukas = ["ALL", "Bicholim", "Bardez", "Tiswadi", "Salcete", "Quepem"];

const organisations = [
  "ALL",
  "ABC Mining Pvt Ltd",
  "XYZ Minerals",
  "Goa Ore Industries",
];

function DashboardFilters() {
  const { role, roleConfig, filters, updateFilter, resetFilters, isParty } =
    useDashboard();

  const handleDistrictChange = (event) => {
    updateFilter("district", event.target.value);

    // Reset taluka when district changes.
    updateFilter("taluka", "ALL");
  };

  return (
    <section className="dashboard-filters">
      <div className="dashboard-filter-heading">
        <div>
          <span className="filter-eyebrow">Dashboard Scope</span>

          <h1>Dashboard</h1>

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

        {roleConfig.filters.district && (
          <div className="filter-field">
            <label>District</label>

            <select value={filters.district} onChange={handleDistrictChange}>
              {districts.map((district) => (
                <option key={district} value={district}>
                  {district === "ALL" ? "All Districts" : district}
                </option>
              ))}
            </select>
          </div>
        )}

        {roleConfig.filters.taluka && (
          <div className="filter-field">
            <label>Taluka</label>

            <select
              value={filters.taluka}
              onChange={(event) => updateFilter("taluka", event.target.value)}
            >
              {talukas.map((taluka) => (
                <option key={taluka} value={taluka}>
                  {taluka === "ALL" ? "All Talukas" : taluka}
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

      {isParty && (
        <div className="party-scope-bar">
          <span className="scope-dot" />

          <span>Organisation scope:</span>

          <strong>Current Organisation</strong>
        </div>
      )}
    </section>
  );
}

export default DashboardFilters;
