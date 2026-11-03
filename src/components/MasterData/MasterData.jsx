import React, { useState } from "react";
import CollapseButton, { useCollapsible } from "../common/SectionPanel/SectionPanel";
import { useDashboard } from "../../context/DashboardContext";
import DetailDrawer from "../common/DetailDrawer/DetailDrawer";
import PeriodChip, { PartyTag } from "../common/PeriodChip/PeriodChip";
import { Icon } from "../DashboardOverview/OverviewParts";
import "./MasterData.css";

/*
 * Sample data until the registration API is connected.
 * Party names are placeholders, not real organisations.
 */
const PARTY_NAMES = [
  "ABC Mining Pvt Ltd",
  "XYZ Minerals",
  "Goa Ore Industries",
  "Konkan Minerals",
  "Mandovi Ore Traders",
  "Zuari Minerals",
  "Sanguem Mining Co.",
  "Bicholim Ore Pvt Ltd",
  "Sattari Minerals",
  "Quepem Ore Works",
  "Canacona Exports",
  "Dharbandora Mining",
  "Ponda Ore Logistics",
  "Salcete Minerals",
  "Pernem Ore Co.",
  "Tiswadi Traders",
  "Bardez Minerals",
  "Mormugao Ore Shippers",
  "Usgao Mining",
  "Sanquelim Ores",
  "Curchorem Minerals",
  "Valpoi Ore Pvt Ltd",
  "Shiroda Mining",
  "Colvale Traders",
];

export const partyRegistry = PARTY_NAMES.map((name, index) => {
  const year = 2008 + ((index * 5) % 17);
  const month = (index * 7) % 12;
  const day = 1 + ((index * 11) % 27);

  return {
    id: `DMG/PTY/${year}/${String(101 + index * 13).padStart(4, "0")}`,
    name,
    registeredOn: new Date(year, month, day),
    resources: {
      trucks: 20 + ((index * 17) % 60),
      machinery: 4 + ((index * 3) % 15),
      leases: 1 + (index % 4),
      dumps: index % 3,
      blocks: 1 + ((index * 5) % 6),
      locations: 2 + (index % 5),
      routes: 3 + ((index * 2) % 7),
    },
  };
});

// Registered resources in the portal (sample). Party users see their own figures.
const resourceData = {
  superAdmin: {
    trucks: { active: 1624, inactive: 218 },
    barges: { active: 108, inactive: 18 },
    weighbridges: { active: 30, inactive: 4 },
  },
  party: {
    trucks: { active: 31, inactive: 3 },
    barges: { active: 3, inactive: 1 },
  },
};

export const violationData = {
  superAdmin: {
    id: "violations",
    title: "Violations",
    count: 47,
    label: "Recorded violations · Sample data",
    details: [
      { label: "Overspeeding", count: 26 },
      { label: "Device Tampering", count: 8 },
      { label: "Expired Permit with Stock", count: 8 },
      { label: "User Blocked", count: 5 },
    ],
  },
  party: {
    id: "violations",
    title: "Violations",
    count: 6,
    label: "Your recorded violations · Sample data",
    details: [
      { label: "Overspeeding", count: 3 },
      { label: "Device Tampering", count: 1 },
      { label: "Expired Permit with Stock", count: 1 },
      { label: "User Blocked", count: 1 },
    ],
  },
};

const RESOURCE_TILES = [
  { key: "trucks", label: "Trucks", icon: "trip" },
  { key: "machinery", label: "Machinery", icon: "machine" },
  { key: "leases", label: "Leases allotted", icon: "lease" },
  { key: "dumps", label: "Dumps allotted", icon: "dump" },
  { key: "blocks", label: "Blocks", icon: "block" },
  { key: "locations", label: "Locations", icon: "location" },
  { key: "routes", label: "Routes", icon: "route" },
];

const PAGE_SIZE = 8;

const number = (value) => value.toLocaleString("en-IN");
const formatDate = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("day")}-${get("month").slice(0, 3)}-${get("year")}`;
};

function MasterData() {
  const { isParty } = useDashboard();

  const resources = isParty ? resourceData.party : resourceData.superAdmin;
  const violations = isParty ? violationData.party : violationData.superAdmin;

  const stats = [
    { key: "trucks", icon: "trip", title: "Registered Trucks", status: resources.trucks },
    { key: "barges", icon: "ship", title: "Registered Barges", status: resources.barges },
    resources.weighbridges && { key: "weighbridges", icon: "scale", title: "Weighbridges", status: resources.weighbridges },
  ].filter(Boolean);

  const collapse = useCollapsible(false);

  return (
    <section className={`master-data-section dash-panel${collapse.open ? "" : " collapsed"}`}>
      <div className="section-header panel-head">
        <div>
          <h2>Master Data</h2>
          <p>Registered parties, vehicles, weighbridges and violations</p>
        </div>
        <div className="panel-head-actions">
          <PeriodChip />
          <PartyTag />
          <CollapseButton collapse={collapse} label="Master Data" />
        </div>
      </div>

      {collapse.open && (
        <>

      <PartyTable parties={isParty ? partyRegistry.slice(0, 1) : partyRegistry} />

      <div className="md-stats">
        {stats.map((stat, index) => {
          const total = stat.status.active + stat.status.inactive;
          const activeShare = Math.round((stat.status.active / total) * 100);
          return (
            <MasterStat key={stat.key} id={stat.key} icon={stat.icon} title={stat.title} value={total} index={index}>
              <div className="md-pop-bar" aria-hidden="true">
                <span style={{ width: `${activeShare}%` }} />
              </div>
              <ul>
                <li>
                  <span><i className="dot active" aria-hidden="true" />Active</span>
                  <strong>{number(stat.status.active)}</strong>
                </li>
                <li>
                  <span><i className="dot inactive" aria-hidden="true" />Inactive</span>
                  <strong>{number(stat.status.inactive)}</strong>
                </li>
              </ul>
              <p>{activeShare}% active</p>
            </MasterStat>
          );
        })}

        <MasterStat id="violations" icon="alert" title="Violations" value={violations.count} index={stats.length} tone="alert">
          <ul>
            {violations.details.map((item) => (
              <li key={item.label}>
                <span>{item.label}</span>
                <strong>{number(item.count)}</strong>
              </li>
            ))}
          </ul>
          <p>Recorded up to yesterday</p>
        </MasterStat>
      </div>
        </>
      )}
    </section>
  );
}

/* =========================================
   REGISTERED PARTIES TABLE
========================================= */

function PartyTable({ parties }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);

  const term = query.trim().toLowerCase();
  const filtered = term
    ? parties.filter((party) => party.name.toLowerCase().includes(term) || party.id.toLowerCase().includes(term))
    : parties;
  const pages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="md-table-card">
      <div className="md-table-header">
        <div>
          <h3>Registered Parties</h3>
          <span>{number(parties.length)} parties registered in the portal</span>
        </div>

        {parties.length > 1 && (
          <input
            type="search"
            className="md-search"
            placeholder="Search name or registration ID"
            aria-label="Search parties"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        )}
      </div>

      <div className="md-table-wrap">
        <table className="md-table">
          <thead>
            <tr>
              <th scope="col">Sl No</th>
              <th scope="col">Registration ID</th>
              <th scope="col">Party Name</th>
              <th scope="col">Registered From</th>
              <th scope="col" className="md-action-col">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((party, index) => (
              <tr key={party.id}>
                <td>{current * PAGE_SIZE + index + 1}</td>
                <td className="md-mono">{party.id}</td>
                <td className="md-name">{party.name}</td>
                <td>{formatDate(party.registeredOn)}</td>
                <td className="md-action-col">
                  <button type="button" className="md-view" onClick={() => setSelected(party)}>
                    View resources
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="md-empty">
                  No party matches “{query}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="md-pager">
          <span>
            {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div>
            <button type="button" onClick={() => setPage(current - 1)} disabled={current === 0}>
              ‹ Previous
            </button>
            <button type="button" onClick={() => setPage(current + 1)} disabled={current === pages - 1}>
              Next ›
            </button>
          </div>
        </div>
      )}

      {selected && (
        <DetailDrawer
          open
          onClose={() => setSelected(null)}
          eyebrow="Registered Party"
          title={selected.name}
          description={`${selected.id} · registered from ${formatDate(selected.registeredOn)}`}
        >
          <div className="md-resource-grid">
            {RESOURCE_TILES.map((tile) => (
              <div className="md-resource" key={tile.key}>
                <span className="md-resource-icon">
                  <Icon name={tile.icon} size={18} />
                </span>
                <div>
                  <span>{tile.label}</span>
                  <strong>{number(selected.resources[tile.key])}</strong>
                </div>
              </div>
            ))}
          </div>
          <p className="md-resource-note">Registered against this party as of the end of yesterday.</p>
        </DetailDrawer>
      )}
    </div>
  );
}

/* =========================================
   RESOURCE / VIOLATION FIGURE WITH HOVER POP-UP
========================================= */

function MasterStat({ id, icon, title, value, index, tone, children }) {
  return (
    <div
      className={`md-stat${tone ? ` ${tone}` : ""}`}
      tabIndex={0}
      aria-describedby={`md-pop-${id}`}
      style={{ "--bounce-delay": `${index * 70}ms` }}
    >
      <span className="md-stat-icon">
        <Icon name={icon} size={20} />
      </span>
      <div className="md-stat-body">
        <span className="md-stat-title">{title}</span>
        <strong>{number(value)}</strong>
        <span className="md-stat-hint">Hover for details ›</span>
      </div>

      <div className="md-stat-pop" role="tooltip" id={`md-pop-${id}`}>
        {children}
      </div>
    </div>
  );
}

export default MasterData;
