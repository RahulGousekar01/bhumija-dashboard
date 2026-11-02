import moment from "moment";
import { DATE_FORMAT } from "constants/DashboardConstant";

/**
 * The dashboard shows previous-day (T-1) consolidated data.
 * The "as on" date is yesterday in Indian Standard Time.
 */
export const getAsOnDate = () => {
  const todayIST = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return moment(todayIST, "YYYY-MM-DD").subtract(1, "day");
};

export const formatDate = (value) => (value ? moment(value).format(DATE_FORMAT) : "N/A");

export const formatDateTime = (value) => (value ? moment(value).format(`${DATE_FORMAT} hh:mm A`) : "N/A");

/** Financial year "2026-27" → [1-Apr-2026, 31-Mar-2027]. */
export const financialYearRange = (financialYear) => {
  const startYear = Number(financialYear.slice(0, 4));
  return [moment(`${startYear}-04-01`), moment(`${startYear + 1}-03-31`)];
};

export const formatNumber = (value) => Number(value || 0).toLocaleString("en-IN");

export const formatMT = (value) => `${formatNumber(value)} MT`;
