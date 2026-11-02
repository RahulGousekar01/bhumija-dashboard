/*
 * Date helpers for T-1 data. All business dates are Indian Standard Time
 * calendar days, held as ISO "YYYY-MM-DD" strings so they never shift with
 * the viewer's time zone.
 */

const IST = "Asia/Kolkata";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today's calendar date in IST, as YYYY-MM-DD. */
export const todayIST = (now = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);

/** Add (or subtract) whole days to an ISO date. */
export const addDays = (iso: string, days: number): string => {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + days));
  return date.toISOString().slice(0, 10);
};

/** The latest consolidated day: yesterday in IST. */
export const latestT1 = (now = new Date()): string => addDays(todayIST(now), -1);

export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);

/** DD-MMM-YYYY, the portal's standard format (e.g. 27-Oct-2026). */
export const formatDate = (iso: string): string => {
  const [year, month, day] = iso.slice(0, 10).split("-");
  return `${day}-${MONTHS[Number(month) - 1]}-${year}`;
};

/** Short axis label: 27-Oct. */
export const formatDayMonth = (iso: string): string => formatDate(iso).slice(0, 6);

/** DD-MMM-YYYY HH:mm IST for a full timestamp. */
export const formatDateTime = (isoTimestamp: string): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(isoTimestamp));
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  // Month names vary by browser locale data ("Sep" / "Sept"); use the portal's set.
  const month = MONTHS.find((name) => get("month").startsWith(name)) ?? get("month");
  return `${get("day")}-${month}-${get("year")} ${get("hour")}:${get("minute")} IST`;
};

/** "Yesterday", "2 days ago" … relative to today in IST. */
export const relativeDay = (iso: string, now = new Date()): string => {
  const days = daysBetween(iso, todayIST(now));
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

/** First day of the Indian financial year containing the date. */
export const financialYearStart = (iso: string): string => {
  const [year, month] = iso.split("-").map(Number);
  return `${month! >= 4 ? year : year! - 1}-04-01`;
};

export const monthStart = (iso: string): string => `${iso.slice(0, 7)}-01`;

/** "2026-27" for a date in that financial year. */
export const financialYearLabel = (iso: string): string => {
  const start = Number(financialYearStart(iso).slice(0, 4));
  return `${start}-${String(start + 1).slice(2)}`;
};
