import React, { useState } from "react";
import "./SectionPanel.css";

/** Open / closed state for a dashboard section. */
export function useCollapsible(defaultOpen = false) {
  const [open, setOpen] = useState(defaultOpen);
  return { open, toggle: () => setOpen((value) => !value) };
}

/** Round chevron button that opens or closes a section. */
function CollapseButton({ collapse, label }) {
  return (
    <button
      type="button"
      className={`panel-toggle${collapse.open ? " open" : ""}`}
      onClick={collapse.toggle}
      aria-expanded={collapse.open}
      aria-label={`${collapse.open ? "Collapse" : "Expand"} ${label}`}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default CollapseButton;
