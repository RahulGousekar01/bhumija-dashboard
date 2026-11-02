// Shared chart colours and helpers, so every chart on the dashboard matches.

export const CHART_COLORS = {
  primary: "#FF6B72",
  rom: "#ADB5BD",
  lumps: "#FF6B72",
  fines: "#FFA94D",
  blue: "#4DABF7",
  green: "#51CF66",
  purple: "#9775FA",
  grey: "#CED4DA",
};

// Order used when a chart needs several categorical colours.
export const PALETTE = ["#FF6B72", "#4DABF7", "#FFA94D", "#51CF66", "#9775FA", "#ADB5BD"];

export const AXIS_TICK = { fontSize: 11, fill: "#6c757d" };

export const TOOLTIP_STYLE = {
  border: "1px solid #e2e5e9",
  borderRadius: 6,
  fontSize: 12,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
};

export const formatMT = (value) => `${Number(value).toLocaleString("en-IN")} MT`;

export const formatCompact = (value) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value);

/** ₹ in lakh / crore, as used in government reports. */
export const formatRupeesShort = (value) => {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${Number(value).toLocaleString("en-IN")}`;
};
