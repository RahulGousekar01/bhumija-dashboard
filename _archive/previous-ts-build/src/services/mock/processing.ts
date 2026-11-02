import type { ProcessingSource } from "../../types/dashboard";

/*
 * The backend can return any number of grade bands per material;
 * nothing in the UI assumes a fixed count.
 */
export const processingSources: ProcessingSource[] = [
  {
    key: "eauction",
    title: "eAuction",
    rom: 4500,
    lumps: {
      total: 14000,
      grades: [
        { range: "41–45%", quantity: 1800 },
        { range: "45–51%", quantity: 2900 },
        { range: "51–55%", quantity: 3900 },
        { range: "55–59%", quantity: 3100 },
        { range: "59–65%", quantity: 2300 },
      ],
    },
    fines: {
      total: 10000,
      grades: [
        { range: "41–45%", quantity: 1400 },
        { range: "45–51%", quantity: 2100 },
        { range: "51–55%", quantity: 2600 },
        { range: "55–59%", quantity: 2100 },
        { range: "59–65%", quantity: 1800 },
      ],
    },
  },

  {
    key: "royaltyPrimary",
    title: "Royalty Paid",
    flag: "PRIMARY",
    rom: 5200,
    lumps: {
      total: 17600,
      grades: [
        { range: "41–45%", quantity: 2100 },
        { range: "45–51%", quantity: 3500 },
        { range: "51–55%", quantity: 4700 },
        { range: "55–59%", quantity: 4100 },
        { range: "59–65%", quantity: 3200 },
      ],
    },
    fines: {
      total: 9600,
      grades: [
        { range: "41–45%", quantity: 1300 },
        { range: "45–51%", quantity: 2000 },
        { range: "51–55%", quantity: 2500 },
        { range: "55–59%", quantity: 2100 },
        { range: "59–65%", quantity: 1700 },
      ],
    },
  },

  {
    key: "royaltySecondary",
    title: "Royalty Paid",
    flag: "NON PRIMARY",
    rom: 3100,
    lumps: {
      total: 10200,
      grades: [
        { range: "41–45%", quantity: 1200 },
        { range: "45–51%", quantity: 2100 },
        { range: "51–55%", quantity: 2700 },
        { range: "55–59%", quantity: 2300 },
        { range: "59–65%", quantity: 1900 },
      ],
    },
    fines: {
      total: 5400,
      grades: [
        { range: "41–45%", quantity: 800 },
        { range: "45–51%", quantity: 1100 },
        { range: "51–55%", quantity: 1400 },
        { range: "55–59%", quantity: 1200 },
        { range: "59–65%", quantity: 900 },
      ],
    },
  },
];
