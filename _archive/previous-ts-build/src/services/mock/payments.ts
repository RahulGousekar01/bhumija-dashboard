import type { PaymentHead } from "../../types/dashboard";

/*
 * Region is intentionally not part of the payment-head name.
 * DMF and GIOPF show their regional breakup only in the detail view.
 */
export const paymentHeads: PaymentHead[] = [
  {
    key: "royalty",
    title: "Royalty Payment",
    rate: "15.00%",
    description: "15.00% of Average Sale Value",
    total: 18450000,
    type: "material",
    materials: {
      rom: { stock: 8450, amount: 6420000 },
      lumps: { stock: 18200, amount: 7840000 },
      fines: { stock: 11600, amount: 4190000 },
    },
  },

  {
    key: "dmf",
    title: "DMF",
    rate: "10.00%",
    description: "10.00% of Royalty Payment",
    total: 1845000,
    type: "regional",
    regions: [
      {
        key: "north",
        name: "North",
        total: 1120000,
        materials: {
          rom: { stock: 4800, amount: 390000 },
          lumps: { stock: 10800, amount: 475000 },
          fines: { stock: 7100, amount: 255000 },
        },
      },
      {
        key: "south",
        name: "South",
        total: 725000,
        materials: {
          rom: { stock: 3650, amount: 252000 },
          lumps: { stock: 7400, amount: 309000 },
          fines: { stock: 4500, amount: 164000 },
        },
      },
    ],
  },

  {
    key: "giopf",
    title: "GIOPF",
    rate: "10.00%",
    description: "10.00% of Average Sale Value",
    total: 1845000,
    type: "regional",
    regions: [
      {
        key: "north",
        name: "North",
        total: 1085000,
        materials: {
          rom: { stock: 4550, amount: 375000 },
          lumps: { stock: 10200, amount: 450000 },
          fines: { stock: 6800, amount: 260000 },
        },
      },
      {
        key: "south",
        name: "South",
        total: 760000,
        materials: {
          rom: { stock: 3900, amount: 275000 },
          lumps: { stock: 8000, amount: 325000 },
          fines: { stock: 4800, amount: 160000 },
        },
      },
    ],
  },

  {
    key: "nmet",
    title: "NMET",
    rate: "3.00%",
    description: "3.00% of Royalty Payment",
    total: 553500,
    type: "material",
    materials: {
      rom: { stock: 8450, amount: 192600 },
      lumps: { stock: 18200, amount: 235200 },
      fines: { stock: 11600, amount: 125700 },
    },
  },

  // NOTE: the material amounts sum to 78,29,475, not the 78,23,475 total.
  // Kept as received; to confirm with the business team.
  {
    key: "auctionPremium",
    title: "Auction Premium",
    rate: "63.55%",
    description: "63.55% of Average Sale Value",
    total: 7823475,
    type: "material",
    materials: {
      rom: { stock: 8450, amount: 2724000 },
      lumps: { stock: 18200, amount: 3346000 },
      fines: { stock: 11600, amount: 1759475 },
    },
  },
];
