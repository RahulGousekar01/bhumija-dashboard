const LOCALE = "en-IN";

const numberFormat = new Intl.NumberFormat(LOCALE);

const currencyFormat = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatNumber = (value: number): string => numberFormat.format(value);

export const formatMT = (value: number): string => `${formatNumber(value)} MT`;

export const formatMillionMT = (value: number): string =>
  `${(value / 1_000_000).toFixed(1)} M MT`;

export const formatCurrency = (value: number): string => currencyFormat.format(value);

/** Indian short form: ₹3.05 Cr, ₹18.5 L. */
export const formatCrore = (value: number): string => {
  if (Math.abs(value) >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(2)} Cr`;
  if (Math.abs(value) >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)} L`;
  return formatCurrency(value);
};

/** Compact tonnage for tight spaces: 1.25 L MT, 25.0 M MT. */
export const formatCompactMT = (value: number): string => {
  if (value >= 1_000_000) return formatMillionMT(value);
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(2)} L MT`;
  return formatMT(value);
};

/** "+4.2%" / "−3.1%" with a real minus sign. */
export const formatDelta = (value: number): string =>
  `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toFixed(1)}%`;

export const formatPercent =(value: number, digits = 0): string =>
  `${value.toFixed(digits)}%`;

/** Share of `part` in `whole` as 0–100, safe for a zero whole. */
export const percentOf = (part: number, whole: number): number =>
  whole > 0 ? (part / whole) * 100 : 0;

export const sumBy = <T>(items: readonly T[], pick: (item: T) => number): number =>
  items.reduce((total, item) => total + pick(item), 0);
