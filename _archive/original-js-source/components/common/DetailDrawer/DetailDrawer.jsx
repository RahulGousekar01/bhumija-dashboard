import React, { useEffect } from "react";
import "./DetailDrawer.css";

function DetailDrawer({ open, onClose, eyebrow, title, description, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.classList.add("drawer-open");

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("drawer-open");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="detail-drawer-layer">
      <button
        type="button"
        className="detail-drawer-backdrop"
        aria-label="Close details"
        onClick={onClose}
      />

      <aside className="detail-drawer" role="dialog" aria-modal="true">
        <div className="detail-drawer-header">
          <div className="detail-drawer-heading">
            {eyebrow && <span className="detail-drawer-eyebrow">{eyebrow}</span>}
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>

          <button
            type="button"
            className="detail-drawer-close"
            onClick={onClose}
            aria-label="Close details"
          >
            ×
          </button>
        </div>

        <div className="detail-drawer-body">{children}</div>

        {footer && <div className="detail-drawer-footer">{footer}</div>}
      </aside>
    </div>
  );
}

export default DetailDrawer;
