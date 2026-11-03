import React, { useId, useState } from "react";
import "./InfoTip.css";

/**
 * Small "i" button that explains a figure in a pop-up on hover or focus.
 * It gently bounces until it has been opened once.
 */
function InfoTip({ title, children }) {
  const [seen, setSeen] = useState(false);
  const id = useId();

  return (
    <span className="info-tip" onMouseEnter={() => setSeen(true)} onFocus={() => setSeen(true)}>
      <button type="button" className={`info-tip-button${seen ? "" : " unseen"}`} aria-describedby={id} aria-label={title}>
        i
      </button>
      <span className="info-tip-pop" role="tooltip" id={id}>
        <strong>{title}</strong>
        {children}
      </span>
    </span>
  );
}

export default InfoTip;
