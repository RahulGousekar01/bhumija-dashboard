import type { GradedMaterial, MaterialComposition, StockSource } from "../../types/dashboard";

const scaleGraded = (material: GradedMaterial, ratio: number): GradedMaterial => ({
  total: Math.round(material.total * ratio),
  grades: material.grades.map((grade) => ({
    ...grade,
    quantity: Math.round(grade.quantity * ratio),
  })),
});

/*
 * Prototype only: the transported / balance views are derived from the
 * total with fixed ratios. The real API returns all three views directly.
 */
const withViews = (key: string, title: string, total: MaterialComposition): StockSource => ({
  key,
  title,
  views: {
    total,
    transported: {
      rom: Math.round(total.rom * 0.28),
      lumps: scaleGraded(total.lumps, 0.24),
      fines: scaleGraded(total.fines, 0.21),
    },
    balance: {
      rom: Math.round(total.rom * 0.72),
      lumps: scaleGraded(total.lumps, 0.76),
      fines: scaleGraded(total.fines, 0.79),
    },
  },
});

export const stockSources: StockSource[] = [
  withViews("royalty", "Royalty", {
    rom: 8400,
    lumps: {
      total: 32000,
      grades: [
        { range: "41–45%", quantity: 4200 },
        { range: "45–51%", quantity: 6800 },
        { range: "51–55%", quantity: 8400 },
        { range: "55–59%", quantity: 7200 },
        { range: "59–65%", quantity: 5400 },
      ],
    },
    fines: {
      total: 18000,
      grades: [
        { range: "41–45%", quantity: 2800 },
        { range: "45–51%", quantity: 3900 },
        { range: "51–55%", quantity: 4600 },
        { range: "55–59%", quantity: 3700 },
        { range: "59–65%", quantity: 3000 },
      ],
    },
  }),

  withViews("eauction", "eAuction", {
    rom: 5200,
    lumps: {
      total: 18800,
      grades: [
        { range: "41–45%", quantity: 2400 },
        { range: "45–51%", quantity: 3800 },
        { range: "51–55%", quantity: 5200 },
        { range: "55–59%", quantity: 4100 },
        { range: "59–65%", quantity: 3300 },
      ],
    },
    fines: {
      total: 10200,
      grades: [
        { range: "41–45%", quantity: 1500 },
        { range: "45–51%", quantity: 2200 },
        { range: "51–55%", quantity: 2700 },
        { range: "55–59%", quantity: 2100 },
        { range: "59–65%", quantity: 1700 },
      ],
    },
  }),

  withViews("imported", "Imported", {
    rom: 4600,
    lumps: {
      total: 18200,
      grades: [
        { range: "41–45%", quantity: 2100 },
        { range: "45–51%", quantity: 3600 },
        { range: "51–55%", quantity: 4800 },
        { range: "55–59%", quantity: 4300 },
        { range: "59–65%", quantity: 3400 },
      ],
    },
    fines: {
      total: 10000,
      grades: [
        { range: "41–45%", quantity: 1300 },
        { range: "45–51%", quantity: 2100 },
        { range: "51–55%", quantity: 2600 },
        { range: "55–59%", quantity: 2200 },
        { range: "59–65%", quantity: 1800 },
      ],
    },
  }),
];
