import { useEffect, useId, useState } from "react";
import { Icon, SegmentedControl, SelectField } from "../../components/ui";
import {
  ALL,
  COMPARE_OPTIONS,
  DISTRICTS,
  ORGANISATIONS,
  PERIODS,
  initialFilters,
  talukasFor,
} from "../../config/filterOptions";
import { useDashboard } from "../../context/DashboardContext";
import { formatDate } from "../../lib/dates";
import type { DashboardFilters } from "../../types/dashboard";
import styles from "./governance.module.css";

const withAll = (values: string[], allLabel: string) => [
  { value: ALL, label: allLabel },
  ...values.map((value) => ({ value, label: value })),
];

/** Sticky filter bar: reporting window, jurisdiction, organisation, comparison. */
export function FilterBar() {
  const { roleConfig, filters, setFilter, resetFilters, crossFilter, clearCrossFilter, isParty } = useDashboard();
  const enabled = roleConfig.filters;
  const orgListId = useId();
  const orgInputId = useId();
  const fromId = useId();
  const toId = useId();
  const defaults = initialFilters();

  // Local text so the user can type freely; only exact matches are applied.
  const orgFilter = filters.organisation;
  const [orgText, setOrgText] = useState(orgFilter === ALL ? "" : orgFilter);
  useEffect(() => setOrgText(orgFilter === ALL ? "" : orgFilter), [orgFilter]);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  const addChip = (key: keyof DashboardFilters, label: string, display = String(filters[key])) => {
    if (filters[key] !== defaults[key] && filters[key] !== ALL) {
      chips.push({ key, label: `${label}: ${display}`, onRemove: () => setFilter(key, defaults[key]) });
    }
  };
  if (enabled.district) addChip("district", "District");
  if (enabled.taluka) addChip("taluka", "Taluka");
  if (enabled.organisation && !isParty) addChip("organisation", "Organisation");
  addChip("compare", "Compare", COMPARE_OPTIONS.find((option) => option.value === filters.compare)?.label);
  addChip("asOfDate", "As of", formatDate(filters.asOfDate));
  if (crossFilter) chips.push({ key: "cross", label: crossFilter.label, onRemove: clearCrossFilter });

  const breadcrumb = ["Goa", filters.district !== ALL ? filters.district : null, filters.taluka !== ALL ? filters.taluka : null].filter(
    Boolean
  ) as string[];

  return (
    <div className={styles.filterBar}>
      <form className={styles.filterRow} aria-label="Dashboard filters" onSubmit={(event) => event.preventDefault()}>
        <div className={styles.periodField}>
          <span className={styles.fieldLabel} aria-hidden="true">
            Reporting period
          </span>
          <SegmentedControl
            label="Reporting period"
            options={PERIODS}
            value={filters.period}
            onChange={(value) => setFilter("period", value)}
          />
        </div>

        {filters.period === "RANGE" && (
          <div className={styles.rangeFields}>
            <div className={styles.dateField}>
              <label htmlFor={fromId}>From</label>
              <input
                id={fromId}
                type="date"
                value={filters.rangeFrom}
                max={filters.rangeTo}
                onChange={(event) => event.target.value && setFilter("rangeFrom", event.target.value)}
              />
            </div>
            <div className={styles.dateField}>
              <label htmlFor={toId}>To</label>
              <input
                id={toId}
                type="date"
                value={filters.rangeTo}
                min={filters.rangeFrom}
                max={filters.asOfDate}
                onChange={(event) => event.target.value && setFilter("rangeTo", event.target.value)}
              />
            </div>
          </div>
        )}

        {enabled.district && (
          <SelectField
            label="District"
            value={filters.district}
            options={withAll(DISTRICTS, "All districts")}
            onChange={(value) => setFilter("district", value)}
          />
        )}

        {enabled.taluka && (
          <SelectField
            label="Taluka"
            value={filters.taluka}
            options={withAll(talukasFor(filters.district), "All talukas")}
            onChange={(value) => setFilter("taluka", value)}
          />
        )}

        {enabled.organisation && (
          <div className={styles.searchField}>
            <label htmlFor={orgInputId} className={styles.fieldLabel}>
              Party / organisation
            </label>
            <div className={styles.searchInputWrap}>
              <Icon name="search" size={14} />
              <input
                id={orgInputId}
                className={styles.searchInput}
                list={orgListId}
                placeholder="All parties"
                value={orgText}
                onChange={(event) => {
                  const value = event.target.value;
                  setOrgText(value);
                  if (value === "") setFilter("organisation", ALL);
                  else if (ORGANISATIONS.includes(value)) setFilter("organisation", value);
                }}
                onBlur={() => {
                  if (!ORGANISATIONS.includes(orgText)) setOrgText(orgFilter === ALL ? "" : orgFilter);
                }}
              />
              <datalist id={orgListId}>
                {ORGANISATIONS.map((organisation) => (
                  <option key={organisation} value={organisation} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        <SelectField
          label="Compare with"
          value={filters.compare}
          options={COMPARE_OPTIONS}
          onChange={(value) => setFilter("compare", value as DashboardFilters["compare"])}
        />
      </form>

      <div className={styles.chipRow}>
        <nav aria-label="Jurisdiction" className={styles.breadcrumb}>
          <ol>
            {breadcrumb.map((part, index) => (
              <li key={part}>
                {index < breadcrumb.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => (index === 0 ? setFilter("district", ALL) : setFilter("taluka", ALL))}
                  >
                    {part}
                  </button>
                ) : (
                  <span aria-current="location">{part}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {chips.length > 0 && (
          <>
            <ul className={styles.chipList} aria-label="Active filters">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <span className={`${styles.filterChip} ${chip.key === "cross" ? styles.filterChipCross : ""}`}>
                    {chip.label}
                    <button type="button" onClick={chip.onRemove} aria-label={`Remove filter ${chip.label}`}>
                      <Icon name="close" size={12} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <button type="button" className={styles.clearAll} onClick={resetFilters}>
              Clear all
            </button>
          </>
        )}
      </div>
    </div>
  );
}
