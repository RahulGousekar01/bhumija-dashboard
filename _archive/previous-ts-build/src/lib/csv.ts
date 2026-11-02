export interface CsvTable {
  columns: string[];
  rows: (string | number)[][];
}

const escapeCell = (value: string | number) => {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Builds a CSV file in the browser and hands it to the user as a download. */
export function downloadCsv(filename: string, table: CsvTable) {
  const lines = [table.columns, ...table.rows].map((row) => row.map(escapeCell).join(","));
  // BOM so Excel reads the ₹ sign and en dashes as UTF-8.
  const blob = new Blob([`﻿${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
