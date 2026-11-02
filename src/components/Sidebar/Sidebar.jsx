import React from "react";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <nav className="sidebar-nav">
        <button type="button" className="sidebar-item sidebar-item-active">
          <span className="sidebar-icon">▦</span>

          <span className="sidebar-label">Dashboard</span>
        </button>
      </nav>

      <div className="sidebar-bottom">
        <span className="sidebar-version">Bhumija Portal</span>
      </div>
    </aside>
  );
}

export default Sidebar;
