# Integrating the dashboard into `bhumija-react-app`

This folder mirrors the portal's layout. Copy each file to the same path in
the portal repository.

```
integration/bhumija-react-app/
  tsconfig.json                                   → replaces jsconfig.json
  src/Api/DashboardApi/DashboardApi.js            → new: gateway adapter
  src/views/app-views/dashboards/default/index.js → replaces the empty default dashboard
```

## Steps

1. **Copy the dashboard source** into the portal as `src/bhumija-dashboard/`:
   everything under this project's `src/` **except** `index.tsx`, `App.tsx`,
   `react-app-env.d.ts` and `styles/global.css` (the portal has its own reset).
2. **Copy the DMG emblem** used on report letterheads:
   `public/img/dmg-logo.png` → portal `public/img/dmg-logo.png`
   (it is the portal's own `public/img/others/DMG.png`).
3. **Swap `jsconfig.json` for the provided `tsconfig.json`.** Create React App
   refuses to start with both. `baseUrl: "src"` is kept, so imports such as
   `components/...` and `Api/...` work unchanged. `allowJs` keeps every
   existing `.js` file building as before.
4. **Add dependencies** (the portal uses yarn):

   ```bash
   yarn add recharts@3.10.1 @tanstack/react-table@8.21.3
   yarn add -D typescript@5.7.2 @types/react@18 @types/react-dom@18
   ```

   `jspdf`, `jspdf-autotable` and `xlsx` are already in the portal at the
   versions the dashboard uses.
5. **Copy the two integration files** (adapter and default view).
6. Run `yarn start`, log in, and open the default dashboard route.

Not verified: these steps have not been run inside the portal. The dashboard
builds and runs standalone on React 19; it uses no React 19-only APIs, but
test it on the portal's React 18.2 before release.

## How it fits the portal

| Concern | Behaviour |
| --- | --- |
| Header & side nav | The portal's `HeaderNav` and collapsible `SideNav` (80 / 250px) stay as they are. The dashboard renders in the content area and adapts to the remaining width. |
| Drawer | Opens at `z-index: 1040`, above `.app-header` (1000) and `.side-nav` (999). The page behind is dimmed and inert; layout never shifts. |
| Role | From the session: `EncParty` id 1 or 12 → Officer (designations containing "audit" → Auditor); other party types → Party. The prototype "View as" switcher is hidden (`lockRole`). |
| Identity on reviews and reports | `logincredential()`: user name, current designation; office from `EncParty.label`. |
| Status colours | Read from `bhumijaColorView` (`draf_tbckcolor`, `appr_bckcolor`, …) and turned into readable pills. |
| Dates | `DD-MMM-YYYY` everywhere, as in the rest of the portal. |
| URL | Filters and the open drawer are kept in the query string (`?asof=…&panel=…&tab=…`) with the History API. The browser Back button closes the drawer. If you prefer react-router's `history`, replace the three functions in `bhumija-dashboard/lib/urlState.ts`. |
| Loading | The dashboard shows its own skeletons. The adapter uses the global `axios`, so the portal's 401 handling still applies. |

## Backend contract (proposed)

`DashboardApi.js` ships with `USE_SAMPLE_DATA = true`. Set it to `false` once
the server supports these modes. All use the existing encrypted envelope.

### `BHUMIJADASHSNAPSHOT`

`condition` = `asof|period|from|to|district|taluka|organisation|compare`
(`0` = all), e.g. `2026-10-27|30D|0|0|North Goa|0|0|D-1`.
Scope by `partyid` / `partytype` as other modes do.

Returns a DataSet. Dates are `YYYY-MM-DD`; timestamps are ISO with `+05:30`.

| Table | Rows | Columns |
| --- | --- | --- |
| `Table` | 1 | `asondate, latestdate, cutoff, batchid, batchsyncedat` |
| `Table1` | source feeds | `sourceid, sourcename, state (reconciled/partial/late), syncedat, detail` |
| `Table2` | KPIs | `kpiid (revenue/dispatch/permits/pending/discrepancies/expiring), value, delta, vsbaseline, target, spark (comma list)` |
| `Table3` | trend points | `metric (dispatch/revenue/permits), date, label, actual, baseline, latebatch (Y/N)` |
| `Table4` | permit status | `permittype, status, count` |
| `Table5` | rollup | `level (district/taluka), name, parent, dispatch, revenue, permits, pending, discrepancies, dispatchdelta, trend (comma list)` |
| `Table6` | ageing | `queue, sladays, b0_2, b3_7, b8_15, b15, breaches` |
| `Table7` | register records | `recordid, refno, recordtype (permit/tripsheet/challan/stock), subtype, party, district, taluka, location, mineral, oreform, gradeslab, quantity, amount, recorddate, validupto, status, agedays, vehicle, weighbridge, reconstate, variancepct, pendingsource, queues (comma list), reviewedby, revieweddesg, reviewedat, reviewremark` |
| `Table8` | reconciliation sources | `recordid, label, quantity` |
| `Table9` | discrepancies | `recordid, discid, rule, severity (high/medium/low), detail, status, raisedon` |
| `Table10` | fee heads | `recordid, head, amount` |
| `Table11` | audit trail | `recordid, at, by, designation, action, remark, ackno` |
| `Table12` | sign-off | `jurisdictionkey, jurisdiction, officer, designation, state (Signed off/Pending), signedat, remark, openitems` |

Numbers must be numeric (not `"12.000 MT"` strings).

### Save modes (each returns `AckNo`, like other portal saves)

| Mode | Fields |
| --- | --- |
| `BHUMIJADASHREVIEW` | `recordid, remark` |
| `BHUMIJADASHFLAG` | `recordid, rule, severity, remark` |
| `BHUMIJADASHFLAGSTATUS` | `recordid, discid, status (Under review/Resolved/Justified), remark` |
| `BHUMIJADASHSIGNOFF` | `jurisdictionkey, remark` |
| `BHUMIJADASHEXPORTLOG` | `report, format (PDF/Excel), recordid (optional)` |

The server should write each action to an append-only audit table and return
it in `Table11` on the next snapshot.

### Module summaries

The "Module summaries" tab (stock, processing, dumps, payments, permits,
operations, master data) still uses sample data. Map each `get…` method in
the adapter to its existing mode (`BHUMIJAMAJORSTOCK`, `BHUMIJAPERMITCOUNT`, …)
when those responses are confirmed.
