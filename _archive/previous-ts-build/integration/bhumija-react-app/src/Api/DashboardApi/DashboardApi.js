/*
 * Dashboard gateway adapter for the Bhumija portal.
 *
 * Implements the dashboard's DashboardApi contract on top of the portal's
 * existing gateway: one encrypted POST to BASE_URL ("gelapi") with a `mode`,
 * a pipe-delimited `condition` and the usual desg / user / sysoffice / host
 * fields, exactly like majorStockPopulate in Api/api.js.
 *
 * The BHUMIJADASH* modes below are PROPOSED: they do not exist on the server
 * yet. Their DataSet shape is documented in integration/README.md. Until the
 * backend ships them, set USE_SAMPLE_DATA to true to run on sample data.
 */
import axios from "axios";
import { BASE_URL } from "constants/ApiConstant";
import {
  authData,
  decryptDecodeAndParseData,
  encodeAndEncryptObjectValues,
  getPublicIP,
  logincredential,
  partyTypeCredential,
} from "encryt/base64utils";
import { mockDashboardApi } from "bhumija-dashboard/services/dashboardApi";

export const USE_SAMPLE_DATA = true;

const ALL = "ALL";

/* ---------- Gateway call (mirrors Api/api.js) ---------- */

async function callMode(mode, fields = {}) {
  const { access_token } = authData();
  if (!access_token) throw new Error("Session expired. Please log in again.");

  const { adm_off_key, adm_user_currDesg, edt_register_userId } = logincredential();
  const party = partyTypeCredential("EncParty");
  const ipAddress = await getPublicIP();

  const body = encodeAndEncryptObjectValues({
    mode,
    switch: "",
    partyid: `${party?.partyid ?? ""}`,
    partytype: `${party?.id ?? ""}`,
    desg: adm_user_currDesg,
    user: edt_register_userId,
    sysoffice: adm_off_key,
    host: ipAddress,
    ...fields,
  });

  const response = await axios.post(BASE_URL, body, {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (response.data.ErrorYn !== "N") {
    throw new Error(response.data.ErrMsg || "Request failed");
  }

  return {
    ackNo: response.data.AckNo,
    data: response.data.Data ? decryptDecodeAndParseData(response.data.Data, true) : {},
  };
}

/* ---------- Scope → condition ---------- */

/** asof|period|from|to|district|taluka|organisation|compare, with 0 for "all". */
const conditionFor = (scope) =>
  [
    scope.asOfDate,
    scope.period,
    scope.period === "RANGE" ? scope.rangeFrom : 0,
    scope.period === "RANGE" ? scope.rangeTo : 0,
    scope.district === ALL ? 0 : scope.district,
    scope.taluka === ALL ? 0 : scope.taluka,
    scope.organisation === ALL || scope.organisation === "CURRENT_PARTY" ? 0 : scope.organisation,
    scope.compare,
  ].join("|");

/* ---------- DataSet → snapshot mapping ---------- */

const csvNumbers = (value) =>
  String(value ?? "")
    .split(",")
    .filter(Boolean)
    .map(Number);
const yes = (value) => value === "Y" || value === true || value === 1;
const groupBy = (rows = [], key) =>
  rows.reduce((map, row) => map.set(row[key], [...(map.get(row[key]) ?? []), row]), new Map());

const AGE_COLUMNS = { "0–2 d": "b0_2", "3–7 d": "b3_7", "8–15 d": "b8_15", ">15 d": "b15" };

/**
 * Maps the proposed BHUMIJADASHSNAPSHOT DataSet (Table … Table12) to the
 * dashboard's GovernanceSnapshot. Column names: see integration/README.md.
 */
export function mapSnapshot(dataset) {
  const [asOf = {}] = dataset.Table ?? [];
  const sources = dataset.Table1 ?? [];
  const recon = groupBy(dataset.Table8, "recordid");
  const discrepancies = groupBy(dataset.Table9, "recordid");
  const fees = groupBy(dataset.Table10, "recordid");
  const audit = groupBy(dataset.Table11, "recordid");

  const trends = { dispatch: [], revenue: [], permits: [] };
  (dataset.Table3 ?? []).forEach((row) =>
    trends[row.metric]?.push({
      date: row.date,
      label: row.label,
      actual: Number(row.actual),
      baseline: Number(row.baseline),
      lateBatch: yes(row.latebatch),
    })
  );

  const statusByType = groupBy(dataset.Table4, "permittype");

  return {
    asOf: {
      asOfDate: asOf.asondate,
      latestDate: asOf.latestdate,
      cutoff: asOf.cutoff ?? "23:59 IST",
      batchId: asOf.batchid,
      batchSyncedAt: asOf.batchsyncedat,
      sources: sources.map((row) => ({
        id: row.sourceid,
        name: row.sourcename,
        state: row.state,
        syncedAt: row.syncedat || null,
        detail: row.detail,
      })),
    },
    kpis: Object.fromEntries(
      (dataset.Table2 ?? []).map((row) => [
        row.kpiid,
        {
          value: Number(row.value),
          delta: Number(row.delta),
          vsBaseline: Number(row.vsbaseline),
          spark: csvNumbers(row.spark),
          target: row.target ? Number(row.target) : undefined,
        },
      ])
    ),
    trends,
    statusBreakdown: [...statusByType.entries()].map(([label, rows]) => ({
      label,
      counts: Object.fromEntries(rows.map((row) => [row.status, Number(row.count)])),
    })),
    rollup: (dataset.Table5 ?? []).map((row) => ({
      key: `${row.level}:${row.name}`,
      name: row.name,
      level: row.level,
      parent: row.parent || undefined,
      dispatch: Number(row.dispatch),
      revenue: Number(row.revenue),
      permits: Number(row.permits),
      pending: Number(row.pending),
      discrepancies: Number(row.discrepancies),
      dispatchDelta: Number(row.dispatchdelta),
      trend: csvNumbers(row.trend),
    })),
    ageing: (dataset.Table6 ?? []).map((row) => ({
      queue: row.queue,
      slaDays: Number(row.sladays),
      breaches: Number(row.breaches),
      buckets: Object.fromEntries(Object.entries(AGE_COLUMNS).map(([bucket, column]) => [bucket, Number(row[column])])),
    })),
    records: (dataset.Table7 ?? []).map((row) => ({
      id: String(row.recordid),
      refNo: row.refno,
      type: row.recordtype,
      subtype: row.subtype,
      party: row.party,
      district: row.district,
      taluka: row.taluka,
      location: row.location,
      mineral: row.mineral,
      oreForm: row.oreform,
      gradeSlab: row.gradeslab,
      quantity: Number(row.quantity),
      amount: Number(row.amount),
      date: row.recorddate,
      validUpto: row.validupto || undefined,
      status: row.status,
      ageDays: Number(row.agedays),
      vehicle: row.vehicle || undefined,
      weighbridge: row.weighbridge || undefined,
      queues: String(row.queues ?? "").split(",").filter(Boolean),
      recon: {
        state: row.reconstate,
        variancePct: Number(row.variancepct ?? 0),
        pendingSource: row.pendingsource || undefined,
        sources: (recon.get(row.recordid) ?? []).map((source) => ({ label: source.label, quantity: Number(source.quantity) })),
      },
      discrepancies: (discrepancies.get(row.recordid) ?? []).map((item) => ({
        id: String(item.discid),
        rule: item.rule,
        severity: item.severity,
        detail: item.detail,
        status: item.status,
        raisedOn: item.raisedon,
      })),
      fees: fees.has(row.recordid)
        ? fees.get(row.recordid).map((fee) => ({ head: fee.head, amount: Number(fee.amount) }))
        : undefined,
      audit: (audit.get(row.recordid) ?? []).map((entry) => ({
        at: entry.at,
        by: entry.by,
        designation: entry.designation,
        action: entry.action,
        remark: entry.remark || undefined,
        ackNo: entry.ackno || undefined,
      })),
      reviewed: row.reviewedby
        ? { by: row.reviewedby, designation: row.revieweddesg, at: row.reviewedat, remark: row.reviewremark }
        : undefined,
    })),
    signOff: (dataset.Table12 ?? []).map((row) => ({
      key: row.jurisdictionkey,
      jurisdiction: row.jurisdiction,
      officer: row.officer,
      designation: row.designation,
      state: row.state,
      signedAt: row.signedat || undefined,
      remark: row.remark || undefined,
      openItems: Number(row.openitems),
    })),
  };
}

/* ---------- The API object ---------- */

const gatewayApi = {
  // Module summaries keep their sample data until each is mapped to its
  // existing mode (e.g. getStockSummary → BHUMIJAMAJORSTOCK).
  ...mockDashboardApi,

  getGovernanceSnapshot: async (scope) => {
    const { data } = await callMode("BHUMIJADASHSNAPSHOT", { condition: conditionFor(scope) });
    return mapSnapshot(data);
  },

  markReviewed: async (recordId, remark) => {
    const { ackNo } = await callMode("BHUMIJADASHREVIEW", { recordid: recordId, remark });
    return { ackNo };
  },

  flagDiscrepancy: async (recordId, input) => {
    const { ackNo } = await callMode("BHUMIJADASHFLAG", {
      recordid: recordId,
      rule: input.rule,
      severity: input.severity,
      remark: input.remark,
    });
    return { ackNo };
  },

  updateDiscrepancy: async (recordId, discrepancyId, status, remark) => {
    const { ackNo } = await callMode("BHUMIJADASHFLAGSTATUS", {
      recordid: recordId,
      discid: discrepancyId,
      status,
      remark,
    });
    return { ackNo };
  },

  signOff: async (jurisdictionKey, remark) => {
    const { ackNo } = await callMode("BHUMIJADASHSIGNOFF", { jurisdictionkey: jurisdictionKey, remark });
    return { ackNo };
  },

  logExport: async (report, format, _officer, recordId) => {
    const { ackNo } = await callMode("BHUMIJADASHEXPORTLOG", { report, format, recordid: recordId ?? "" });
    return { ackNo };
  },
};

export const dashboardApi = USE_SAMPLE_DATA ? mockDashboardApi : gatewayApi;
