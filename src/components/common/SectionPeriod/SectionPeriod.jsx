import React, { useMemo, useState } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { PERIOD_PRESETS, describePeriod, monthBounds } from "../../../context/period";
import { Icon } from "../../DashboardOverview/OverviewParts";
import "./SectionPeriod.css";

/**
 * A section's own reporting period. `defaultPreset` is what the section shows
 * first and what Reset returns to ("1" = yesterday, "fy" = financial year so far).
 */
export function useSectionPeriod(defaultPreset = "1") {
  const { filters } = useDashboard();
  const [state, setState] = useState({ preset: defaultPreset, fromMonth: null, toMonth: null });
  const period = useMemo(() => describePeriod(state, filters.financialYear), [state, filters.financialYear]);

  return { period, state, setState, defaultPreset };
}

/** The period a section is showing, e.g. "FY 2026-27 · as of yesterday · 01-Apr-2026 to 01-Nov-2026". */
export function SectionPeriodChip({ control }) {
  const { period } = control;
  return (
    <span className="section-period-chip" aria-live="polite">
      <Icon name="calendar" size={13} />
      {period.title} · {period.range}
    </span>
  );
}

/**
 * Right-hand controls: [months] Custom · 30 days · 7 days · Reset.
 * Custom sits first so its month pickers open on the left without moving the buttons.
 */
function SectionPeriodFilter({ control, label = "Period" }) {
  const { state, setState, defaultPreset } = control;
  const bounds = monthBounds();

  const choose = (preset) => setState({ ...state, preset });
  const chooseCustom = () =>
    setState({ preset: "custom", fromMonth: state.fromMonth ?? bounds.max, toMonth: state.toMonth ?? bounds.max });
  const changeFrom = (fromMonth) => setState({ ...state, fromMonth, toMonth: fromMonth > state.toMonth ? fromMonth : state.toMonth });
  const changeTo = (toMonth) => setState({ ...state, toMonth, fromMonth: toMonth < state.fromMonth ? toMonth : state.fromMonth });

  return (
    <div className="section-period">
      {state.preset === "custom" && (
        <div className="section-period-months">
          <label>
            From
            <input
              type="month"
              value={state.fromMonth}
              min={bounds.min}
              max={bounds.max}
              onChange={(event) => event.target.value && changeFrom(event.target.value)}
            />
          </label>
          <label>
            To
            <input
              type="month"
              value={state.toMonth}
              min={bounds.min}
              max={bounds.max}
              onChange={(event) => event.target.value && changeTo(event.target.value)}
            />
          </label>
        </div>
      )}

      <div className="section-period-options" role="group" aria-label={label}>
        <button type="button" aria-pressed={state.preset === "custom"} onClick={chooseCustom}>
          Custom
        </button>
        {[...PERIOD_PRESETS].reverse().map((item) => (
          <button key={item.key} type="button" aria-pressed={state.preset === item.key} onClick={() => choose(item.key)}>
            {item.label}
          </button>
        ))}
        <button
          type="button"
          className="section-period-reset"
          onClick={() => setState({ preset: defaultPreset, fromMonth: null, toMonth: null })}
          disabled={state.preset === defaultPreset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default SectionPeriodFilter;
