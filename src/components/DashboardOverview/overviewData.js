/*
 * Sample figures for the Overview (Ore Flow, period totals, trend chart).
 *
 * The section data holds one day's figures (yesterday, T-1). To show the
 * 7 / 15 / 30 day views, each figure gets a sample 30-day daily series ending
 * yesterday; a period total is the sum of its last N days. Splits that the
 * section data does not carry yet (extraction by source, stock by location,
 * transport by permit type, payment by source) are sample values too.
 * Replace all of this with API data.
 */
import { stockData } from "../StockSummary/StockSummary";
import { processingData } from "../OreProcessing/OreProcessing";
import { paymentData } from "../PaymentSummary/PaymentSummary";
import { SHAPES, SHAPE_DAYS, rangeFactor } from "../../context/period";

const sum = (items, pick = (item) => item) => items.reduce((total, item) => total + pick(item), 0);

/* ---------- Periods ---------- */

// The daily pattern lives with the period so sections can share it without circular imports.
export { dailyValues, rangeFactor } from "../../context/period";

/** Scales a breakdown to the period, keeping the parts adding up to the scaled total. */
export const scaleItems = (items, factor) => {
  const scaled = items.map((item) => ({ ...item, value: Math.round(item.value * factor) }));
  const target = Math.round(sum(items, (item) => item.value) * factor);
  scaled[scaled.length - 1].value += target - sum(scaled, (item) => item.value);
  return scaled;
};

/* ---------- Ore flow ---------- */

const splitBy = (total, shares, round = 1) => {
  const values = shares.map(([, share]) => Math.round((total * share) / round) * round);
  values[values.length - 1] += total - sum(values);
  return shares.map(([label], index) => ({ label, value: values[index] }));
};

/** Ore flow for a period (days ago, 1 = yesterday). Stock is the end-of-yesterday position. */
export function buildOreFlow({ fromDaysAgo, toDaysAgo }) {
  const processing = Object.values(processingData);
  const totalStock = sum(Object.values(stockData), (source) => source.total);
  const totalPayment = sum(paymentData, (payment) => payment.total);
  const volume = rangeFactor("volume", fromDaysAgo, toDaysAgo);
  const payment = rangeFactor("payment", fromDaysAgo, toDaysAgo);

  return {
    // Extracted, by where it came from (sample).
    extracted: scaleItems(
      [
        { label: "eAuctioned", value: 31200 },
        { label: "Allotted", value: 41800 },
        { label: "Dumps (eAuction)", value: 8300 },
        { label: "Dumps (Allotted)", value: 11200 },
      ],
      volume
    ),
    // Processed output by material (Ore Processing data).
    processed: scaleItems(
      [
        { label: "ROM", value: sum(processing, (source) => source.rom) },
        { label: "Lumps", value: sum(processing, (source) => source.lumps.total) },
        { label: "Fines", value: sum(processing, (source) => source.fines.total) },
      ],
      volume
    ),
    // Stock at the end of yesterday, by location (sample split of the Stock Summary total).
    stock: splitBy(totalStock, [
      ["Block area", 0.66],
      ["Dump", 0.34],
    ], 100),
    // Transported, by permit type (sample).
    transported: scaleItems(
      [
        { label: "Export", value: 5200 },
        { label: "Sale", value: 2140 },
        { label: "Transit", value: 3900 },
      ],
      volume
    ),
    // Payment by what it was made against (sample split of the Payment Summary total).
    payment: scaleItems(
      splitBy(totalPayment, [
        ["Royalty", 0.6],
        ["eAuction", 0.22],
        ["Imported ore", 0.1],
        ["Dumps royalty", 0.08],
      ]),
      payment
    ),
  };
}

/* ---------- Trend chart ---------- */

/** Permits and payment per day for `days` days ending `toDaysAgo` (1 = yesterday). */
export function buildDailySeries(yesterday, permitsYesterday, days, toDaysAgo = 1) {
  const totalPayment = sum(paymentData, (payment) => payment.total);
  const format = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", timeZone: "Asia/Kolkata" });

  return Array.from({ length: days }, (_, offset) => {
    const index = SHAPE_DAYS - days - (toDaysAgo - 1) + offset;
    const date = new Date(yesterday.getTime() - (days - 1 - offset + toDaysAgo - 1) * 24 * 60 * 60 * 1000);
    return {
      day: format.format(date).replace(" ", "-"),
      permits: Math.round(permitsYesterday * SHAPES.permits[index]),
      payment: Math.round(totalPayment * SHAPES.payment[index]),
    };
  });
}
