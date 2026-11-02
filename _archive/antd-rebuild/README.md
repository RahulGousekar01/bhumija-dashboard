# Bhumija Dashboard (T-1)

A single dashboard view for the Bhumija Mining Management Portal, built on
the same stack as the portal: **React 18.2, JavaScript, antd 4.16.13, moment**.
It runs on sample data until it is connected to the gateway.

```bash
npm install
npm start          # http://localhost:3000
npm run build
```

## What the page shows

| Area | Content |
| --- | --- |
| Header | Portal logo, menu toggle, "Login As" switch (prototype only), user name and role |
| Side menu | Portal modules. Collapses to icons (80px) with tooltips and expands to labels (250px). Below 992px it becomes a slide-in menu. |
| Data as of | "Data as of: Yesterday (T-1), DD-MMM-YYYY": every figure is the previous day's consolidated data |
| Filters | Financial year, district, taluka, organisation (Super Admin only). They apply to the whole page. |
| Permit status | Count cards: total, Draft, Submitted, Pending, Approved, Rejected. Selecting a card filters the table. |
| Permits by type | Import / Export / Transit / Sale counts, with how many are approved |
| Transit (trip sheets) | Yesterday's trip sheets: generated, closed, in transit, road / barge, quantity transported, active transit permits |
| Stock position | Total stock and Royalty / eAuction / Imported at the end of yesterday |
| Permit applications table | Same columns as the portal's Permit List. Search, type / status / application-date filters, sorting, pagination, CSV export. |
| Detail drawer | Opens from any row. 60% width on desktop, full width on mobile. Shows application details, quantities, workflow history, and the permit certificate download (approved permits only). |

## Roles

| | Super Admin | Party |
| --- | --- | --- |
| Data | All organisations | Own organisation only |
| Organisation filter | Yes | No |
| Party column / field | Shown | Hidden |
| Drawer | View, download certificate | View, download certificate |

In the portal the role comes from the session. In this prototype, use
**Login As** in the header.

## Code map

```
src/
  App.js                                 Portal shell: header, side menu, content, footer
  index.js                               Entry; loads antd.css and the theme
  assets/css/theme.css                   Brand colours on antd, layout, responsive rules
  components/layout-components/          HeaderNav, SideNav, MobileNav, MenuContent, Footer
  configs/NavigationConfig.js            Side menu items
  constants/DashboardConstant.js         Roles, statuses + colours, districts, permit types
  context/RoleContext.js                 Logged-in role (prototype switch)
  Api/DashboardApi/DashboardApi.js       Data calls (sample data, portal response shape)
  data/sampleData.js                     Sample permits, trip sheet and stock figures
  utils/dateUtils.js                     T-1 date, DD-MMM-YYYY formatting, numbers
  views/dashboard/
    index.js                             The page: loads data, holds filters and selection
    DataAsOnBanner.js                    "Data as of: Yesterday (T-1)" stamp
    DashboardFilters.js                  Financial year / district / taluka / organisation
    PermitStatusCards.js                 Status count cards
    OverviewCards.js                     Permits by type, transit, stock
    PermitTable.js                       Permit applications table
    PermitDrawer.js                      Detail drawer
    StatusTag.js                         Status tag in portal colours
    dashboard.css                        Page styles
```

## Connecting the real API

`Api/DashboardApi/DashboardApi.js` returns the portal's response envelope,
`{ ErrorYn, ErrMsg, Data }` with `Data` = JSON `{ Table: [...] }`. The views
read it with `readTable(response)`. To go live, replace each function body
with the usual gateway call (`axios.post(BASE_URL, encodeAndEncryptObjectValues(body), …)`):

| Function | Returns (Table rows) |
| --- | --- |
| `dashboardPermitList(filters)` | Permit rows with `ackno, permitno, appldate, permittype, party, district, taluka, locname, oresource, purpose, mineraldetail, gradeslab, propqnty, approvedqty, dispatchedqty, validupto, status, history[]` |
| `dashboardTripSheetSummary(filters)` | One row: `generated, road, barge, closed, intransit, quantity` (for the T-1 day) |
| `dashboardStockSummary(filters)` | Rows: `source, quantity` |
| `downloadPermitCertificate(ackno)` | One row: `filename, content` (base64 PDF) |

`filters` = `{ financialYear, district, taluka, organisation, role }`.
For a Party, the server scopes data to the logged-in organisation.

## Notes

- **Brand colour:** `#FF6B72` is the accent: selected menu, active page, focus, bars and the T-1 stamp. Text and buttons use the darker `#C93A43`, because white text on `#FF6B72` fails WCAG AA contrast, which GIGW requires.
- **Sample certificate:** the downloadable PDF is a placeholder. The portal's server issues the real certificate.
- **Archive:** `_archive/` holds the original JavaScript source and an earlier TypeScript prototype for reference only. It is not part of the build and can be deleted.
