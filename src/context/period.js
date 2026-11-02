/*
 * Reporting periods for the period-based sections.
 *
 * Data is consolidated once a day (T-1), so every period ends yesterday at
 * the latest. A period is kept as "days ago" (1 = yesterday) so sections can
 * ask for figures over any range. Each section keeps its own period.
 */
import { getYesterday } from "../components/DashboardOverview/OverviewParts";

const DAY = 24 * 60 * 60 * 1000;
const sum = (items) => items.reduce((total, value) => total + value, 0);

// Earliest month the portal has data for (sample).
export const FIRST_MONTH = "2024-04";

/* ---------- Sample daily pattern (replace with API daily figures) ---------- */

// Enough days to reach back to FIRST_MONTH.
export const SHAPE_DAYS = 1100;

/**
 * Daily multipliers ending yesterday (last = 1, i.e. yesterday's figures).
 * Deterministic so the numbers do not jump between renders.
 */
const dailyShape = (seed) =>
  Array.from({ length: SHAPE_DAYS }, (_, index) => {
    if (index === SHAPE_DAYS - 1) return 1;
    const wave = Math.sin(index * 1.3 + seed) * 0.12 + Math.sin(index * 0.45 + seed * 2) * 0.08;
    const sunday = (index + seed) % 7 === 0 ? -0.25 : 0;
    return Math.max(0.5, 0.95 + wave + sunday);
  });

export const SHAPES = {
  volume: dailyShape(1), // extracted, processed, transported
  permits: dailyShape(2),
  payment: dailyShape(3),
};

const shapeSlice = (kind, fromDaysAgo, toDaysAgo) => SHAPES[kind].slice(SHAPE_DAYS - fromDaysAgo, SHAPE_DAYS + 1 - toDaysAgo);

/** Sum of the multipliers over a range (1 = yesterday): how many "yesterdays" the period is worth. */
export const rangeFactor = (kind, fromDaysAgo, toDaysAgo) => sum(shapeSlice(kind, fromDaysAgo, toDaysAgo));

/** A day-by-day series for `base` (yesterday's figure), oldest first. */
export const dailyValues = (kind, base, fromDaysAgo, toDaysAgo) =>
  shapeSlice(kind, fromDaysAgo, toDaysAgo).map((multiplier, index) => ({
    daysAgo: fromDaysAgo - index,
    value: Math.round(base * multiplier),
  }));

/* ---------- Dates ---------- */

/** "2026-10-29" in IST, the format date inputs use. */
export const isoDate = (date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    date
  );

/** "29-Oct-2026" (some browsers print "Sept", so the month is cut to three letters). */
export const dayLabel = (date) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get("day")}-${get("month").slice(0, 3)}-${get("year")}`;
};

/** "Oct 2026" for "2026-10". */
const monthLabel = (month) => {
  const [year, number] = month.split("-").map(Number);
  const name = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(Date.UTC(year, number - 1, 1));
  return `${name.slice(0, 3)} ${year}`;
};

/** Months a custom period may use, as "2026-10". */
export const monthBounds = () => ({ min: FIRST_MONTH, max: isoDate(getYesterday().date).slice(0, 7) });

/* ---------- Periods ---------- */

export const PERIOD_PRESETS = [
  { key: "7", days: 7, label: "7 days" },
  { key: "30", days: 30, label: "30 days" },
];

/**
 * Everything a section needs about its chosen period:
 * fromDaysAgo / toDaysAgo (1 = yesterday), days, a title, a date range and a phrase.
 *
 * preset: "1" (yesterday), "7", "30", "fy" (the selected financial year up to
 * yesterday) or "custom" (fromMonth–toMonth, any months since FIRST_MONTH).
 */
export function describePeriod({ preset, fromMonth, toMonth }, financialYear) {
  const yesterday = getYesterday();
  const yesterdayIso = isoDate(yesterday.date);
  const daysAgo = (iso) => Math.round((Date.parse(`${yesterdayIso}T00:00:00Z`) - Date.parse(`${iso}T00:00:00Z`)) / DAY) + 1;
  const earliest = `${FIRST_MONTH}-01`;

  let fromIso = yesterdayIso;
  let toIso = yesterdayIso;
  let title = "Yesterday";
  let phrase = "yesterday";

  if (preset === "7" || preset === "30") {
    const days = Number(preset);
    fromIso = isoDate(new Date(yesterday.date.getTime() - (days - 1) * DAY));
    title = `Last ${days} days`;
    phrase = `in the last ${days} days`;
  } else if (preset === "fy") {
    const startYear = Number(financialYear.slice(0, 4));
    fromIso = `${startYear}-04-01`;
    toIso = `${startYear + 1}-03-31`;
    title = `FY ${financialYear}`;
    phrase = `in FY ${financialYear}`;
  } else if (preset === "custom" && fromMonth && toMonth) {
    const [toYear, toNumber] = toMonth.split("-").map(Number);
    fromIso = `${fromMonth}-01`;
    toIso = `${toMonth}-${String(new Date(Date.UTC(toYear, toNumber, 0)).getUTCDate()).padStart(2, "0")}`;
    title = fromMonth === toMonth ? monthLabel(fromMonth) : `${monthLabel(fromMonth)} – ${monthLabel(toMonth)}`;
    phrase = `in ${title}`;
  }

  // Never past yesterday, never before the first month of data.
  if (toIso > yesterdayIso) {
    toIso = yesterdayIso;
    if (preset === "fy" || preset === "custom") title += " · as of yesterday";
  }
  if (fromIso < earliest) fromIso = earliest;
  if (fromIso > toIso) fromIso = toIso;

  const fromDaysAgo = daysAgo(fromIso);
  const toDaysAgo = daysAgo(toIso);
  const days = fromDaysAgo - toDaysAgo + 1;

  const dateOf = (ago) => new Date(yesterday.date.getTime() - (ago - 1) * DAY);
  const range = days === 1 ? dayLabel(dateOf(fromDaysAgo)) : `${dayLabel(dateOf(fromDaysAgo))} to ${dayLabel(dateOf(toDaysAgo))}`;

  return {
    preset,
    fromDaysAgo,
    toDaysAgo,
    days,
    isYesterday: fromDaysAgo === 1 && toDaysAgo === 1,
    title,
    range,
    // For sentences: "applied yesterday" / "applied in the last 7 days".
    phrase,
    dateOf,
  };
}
