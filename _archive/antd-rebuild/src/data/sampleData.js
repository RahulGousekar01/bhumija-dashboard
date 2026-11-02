/*
 * Sample data for the prototype.
 *
 * Generated deterministically (same output on every load) for the current
 * and previous financial year, up to the T-1 date. Field names match the
 * portal's permit list (ackno, permitno, appldate, permittype, locname,
 * oresource, propqnty, mineraldetail, validupto, status).
 */
import {
  DISTRICTS,
  GRADE_SLABS,
  ORE_FORMS,
  ORE_SOURCES,
  ORGANISATIONS,
  PURPOSES,
} from "constants/DashboardConstant";
import { getAsOnDate } from "utils/dateUtils";

/* ---------- Deterministic random numbers ---------- */

const seededRandom = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const random = seededRandom(20261027);
const pick = (items) => items[Math.floor(random() * items.length)];
const between = (min, max) => Math.floor(min + random() * (max - min + 1));
const weighted = (options) => {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of options) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return options[0][0];
};

/* ---------- Reference lists ---------- */

const TALUKA_DISTRICT = Object.fromEntries(
  Object.entries(DISTRICTS).flatMap(([district, talukas]) => talukas.map((taluka) => [taluka, district]))
);

const LOCATIONS = {
  Bicholim: ["Sirigao Stockyard", "Maina Plot", "Mulgao Mine Lease"],
  Bardez: ["Pirna Stockyard", "Aldona Jetty"],
  Tiswadi: ["Amona Jetty", "Sarmanas Stockyard"],
  Salcete: ["Cansaulim Plant", "Rachol Jetty"],
  Quepem: ["Cavorem Mine Lease", "Barcem Stockyard"],
};

const TYPE_CODE = { Import: "IMP", Export: "EXP", Transit: "TRN", Sale: "SAL" };

const PARTY_ACTOR = (party) => `${party} (Party)`;
const ADMIN_ACTOR = "DMG Goa (Super Admin)";
const REJECT_REMARKS = [
  "Proposed quantity exceeds available stock at the location.",
  "Weighbridge and stock records do not match. Please re-apply.",
  "Supporting documents incomplete.",
];

/* ---------- Permit applications ---------- */

function buildPermits() {
  const asOn = getAsOnDate();
  const permits = [];
  let sequence = 4100;

  for (let index = 0; index < 180; index++) {
    // More recent applications are more frequent; spread over ~10 months.
    const ageDays = Math.floor(Math.pow(random(), 1.4) * 300);
    const applDate = asOn.clone().subtract(ageDays, "days").hour(between(9, 17)).minute(between(0, 59));
    const party = weighted(ORGANISATIONS.map((name, rank) => [name, 4 - rank]));
    const taluka = weighted([
      ["Bicholim", 5],
      ["Bardez", 2],
      ["Tiswadi", 2],
      ["Salcete", 2],
      ["Quepem", 3],
    ]);
    const permittype = weighted([
      ["Transit", 35],
      ["Export", 25],
      ["Import", 25],
      ["Sale", 15],
    ]);
    const oreForm = pick(ORE_FORMS);
    const propqnty = between(10, 240) * 50;
    const ackno = `ACK${applDate.format("YYMM")}${String(++sequence).padStart(6, "0")}`;

    // Workflow position depends on how old the application is.
    const status =
      ageDays <= 2
        ? weighted([
            ["Draft", 2],
            ["Submitted", 3],
            ["Pending", 2],
          ])
        : ageDays <= 10
          ? weighted([
              ["Submitted", 2],
              ["Pending", 4],
              ["Approved", 5],
              ["Rejected", 1],
            ])
          : weighted([
              ["Approved", 9],
              ["Rejected", 1.2],
              ["Pending", 0.6],
            ]);

    const history = [{ status: "Draft", action: "Application created", by: PARTY_ACTOR(party), at: applDate.clone(), remarks: "" }];
    let decisionDate = null;

    if (status !== "Draft") {
      history.push({
        status: "Submitted",
        action: "Application submitted",
        by: PARTY_ACTOR(party),
        at: applDate.clone().add(between(10, 120), "minutes"),
        remarks: "",
      });
    }
    if (["Pending", "Approved", "Rejected"].includes(status)) {
      history.push({
        status: "Pending",
        action: "Taken up for scrutiny",
        by: ADMIN_ACTOR,
        at: applDate.clone().add(Math.min(ageDays, between(0, 2)), "days").add(between(1, 5), "hours"),
        remarks: "Forwarded for verification of stock and documents.",
      });
    }
    if (status === "Approved" || status === "Rejected") {
      decisionDate = applDate.clone().add(Math.min(ageDays, between(1, 4)), "days").add(between(2, 7), "hours");
      history.push({
        status,
        action: status === "Approved" ? "Permit approved" : "Application rejected",
        by: ADMIN_ACTOR,
        at: decisionDate.clone(),
        remarks: status === "Approved" ? "Approved as per verification report." : pick(REJECT_REMARKS),
      });
    }

    const approved = status === "Approved";
    const approvedQty = approved ? Math.round((propqnty * between(90, 100)) / 100 / 50) * 50 : 0;
    const validupto = approved ? decisionDate.clone().add(30, "days") : null;
    const daysValid = approved ? Math.min(30, Math.max(0, asOn.diff(decisionDate, "days"))) : 0;
    const dispatchedQty = approved ? Math.min(approvedQty, Math.round((approvedQty * daysValid) / 30 / 10) * 10) : 0;

    permits.push({
      key: ackno,
      ackno,
      permitno: approved
        ? `MP/${TYPE_CODE[permittype]}/${decisionDate.format("YY")}-${String(Number(decisionDate.format("YY")) + 1)}/${String(sequence).slice(-4)}`
        : "",
      appldate: applDate.toISOString(),
      permittype,
      party,
      district: TALUKA_DISTRICT[taluka],
      taluka,
      locname: pick(LOCATIONS[taluka]),
      oresource: pick(ORE_SOURCES[permittype]),
      purpose: pick(PURPOSES[permittype]),
      mineraldetail: `Iron Ore - ${oreForm}`,
      gradeslab: pick(GRADE_SLABS),
      propqnty,
      approvedqty: approvedQty,
      dispatchedqty: dispatchedQty,
      validupto: validupto ? validupto.toISOString() : null,
      status,
      history: history.map((entry) => ({ ...entry, at: entry.at.toISOString() })),
    });
  }

  return permits.sort((a, b) => b.appldate.localeCompare(a.appldate));
}

export const permits = buildPermits();

/* ---------- Trip sheets and stock (T-1 figures) ---------- */

// Statewide figures for the T-1 day; scoped figures are a share of these.
export const tripSheetsStatewide = {
  road: 412,
  barge: 18,
  closed: 389,
  quantity: 11240,
};

// Stock by source (MT), from the stock summary.
export const stockStatewide = [
  { source: "Royalty", quantity: 58400 },
  { source: "eAuction", quantity: 34200 },
  { source: "Imported", quantity: 32800 },
];

// Share of statewide activity, used to scope trip sheet and stock figures.
export const DISTRICT_SHARE = { "North Goa": 0.6, "South Goa": 0.4 };
export const TALUKA_SHARE = { Bicholim: 0.5, Bardez: 0.25, Tiswadi: 0.25, Salcete: 0.45, Quepem: 0.55 };
export const ORGANISATION_SHARE = {
  "ABC Mining Pvt Ltd": 0.34,
  "XYZ Minerals": 0.27,
  "Goa Ore Industries": 0.22,
  "Konkan Minerals": 0.17,
};
