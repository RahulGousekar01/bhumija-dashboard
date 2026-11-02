import type { DumpsSummaryData } from "../../types/dashboard";

export const dumpsSummary: DumpsSummaryData = {
  allocation: [
    { party: "ABC Mining Pvt Ltd", allocated: 7200000 },
    { party: "XYZ Minerals", allocated: 5800000 },
    { party: "Goa Ore Industries", allocated: 4600000 },
    { party: "Konkan Minerals", allocated: 3400000 },
  ],

  eauction: [
    { party: "ABC Mining Pvt Ltd", allocated: 1800000 },
    { party: "XYZ Minerals", allocated: 1200000 },
    { party: "Goa Ore Industries", allocated: 700000 },
    { party: "Konkan Minerals", allocated: 300000 },
  ],

  extraction: [
    { party: "ABC Mining Pvt Ltd", extracted: 22000, transported: 9000 },
    { party: "XYZ Minerals", extracted: 16000, transported: 6500 },
    { party: "Goa Ore Industries", extracted: 12000, transported: 4500 },
  ],

  screening: {
    wet: {
      rom: 10000,
      fines: {
        total: 15000,
        grades: [
          { range: "41–45%", quantity: 2500 },
          { range: "45–51%", quantity: 3500 },
          { range: "51–55%", quantity: 4000 },
          { range: "55–59%", quantity: 3000 },
          { range: "59–65%", quantity: 2000 },
        ],
      },
      lumps: {
        total: 10000,
        grades: [
          { range: "41–45%", quantity: 1800 },
          { range: "45–51%", quantity: 2200 },
          { range: "51–55%", quantity: 2600 },
          { range: "55–59%", quantity: 1900 },
          { range: "59–65%", quantity: 1500 },
        ],
      },
      tailings: 5000,
    },

    // NOTE: the dry-screening grade bands sum to 14,000 (fines) and
    // 12,000 (lumps), not the 15,000 totals. Kept as received; to confirm.
    dry: {
      rom: 10000,
      fines: {
        total: 15000,
        grades: [
          { range: "41–45%", quantity: 2300 },
          { range: "45–51%", quantity: 3300 },
          { range: "51–55%", quantity: 3700 },
          { range: "55–59%", quantity: 2800 },
          { range: "59–65%", quantity: 1900 },
        ],
      },
      lumps: {
        total: 15000,
        grades: [
          { range: "41–45%", quantity: 2100 },
          { range: "45–51%", quantity: 2600 },
          { range: "51–55%", quantity: 3000 },
          { range: "55–59%", quantity: 2400 },
          { range: "59–65%", quantity: 1900 },
        ],
      },
    },
  },

  waste: [
    { party: "ABC Mining Pvt Ltd", dump: "Dump A", allocated: 7200000, waste: 4200 },
    { party: "XYZ Minerals", dump: "Dump B", allocated: 5800000, waste: 3100 },
    { party: "Goa Ore Industries", dump: "Dump C", allocated: 4600000, waste: 1800 },
    { party: "Konkan Minerals", dump: "Dump D", allocated: 3400000, waste: 900 },
  ],
};
