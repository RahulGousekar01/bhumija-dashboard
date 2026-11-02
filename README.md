# Bhumija Dashboard — Phase 2 (charts)

The Phase 2 dashboard (original sections, data and layout), with an overview
band at the top and charts added to each section.

```bash
npm install
npm start
```

## What was added

| Where                   | Added                                                                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Top: **Overview** (new) | Six summary cards: Total Stock, Ore Processed, Permits Today, Active Trips, Payments Collected, Alerts & Violations. Three charts: Stock by Source (donut), Today's Permits by Type, Trips in Progress by stage. |
| Stock Summary           | Stock Composition by Source (ROM / Lumps / Fines), Grade Distribution across all sources                                                                                                                         |
| Ore Processing          | Processed Output by Source, Share of Processing (donut)                                                                                                                                                          |
| Dumps Summary           | Annual Dump Allotment by Party (allocation + eAuction), Extracted vs Transported                                                                                                                                 |
| Payment Summary         | Collection by Payment Head, Payments by Material                                                                                                                                                                 |
| Permit Overview         | Purpose of Today's Permits, Ore Source Categories                                                                                                                                                                |
| Operations Overview     | Completed Trips, Needs Attention (awaiting action + exceptions)                                                                                                                                                  |
| Master Data             | Resource Status (% active / operational), Violations by Type (donut)                                                                                                                                             |

All figures come from the same data the section cards already use, so the
overview and charts always match the cards. Role rules are unchanged: a Party
sees its own extraction row, its own violations, and no Parties or
Weighbridges in Master Data.

## Code

- `src/components/DashboardOverview/` — the new overview band.
- `src/components/<Section>/<Section>Charts.jsx` — the charts for each section.
- `src/components/common/ChartCard/` — shared chart card and colours (`chartTheme.js`).

Changes to the original section files:

- Each section's data constant is now exported (for example `export const stockData`), so the overview can reuse it.
- Each section imports and renders its charts component under its cards.
- Stock Summary gets a top margin and the Dumps Summary heading gets the same styling as the other sections.
- An unused `role` variable is removed from `DashboardFilters.jsx`.

Charts use [Recharts](https://recharts.org) 2.15.4. The app runs on React 18.2.

`_archive/` holds earlier experiments for reference only. It is not part of the build and can be deleted.

# bhumija-dashboard

GEL - bhumija dashboard
Changed needed
