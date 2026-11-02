import React from "react";
import { useDashboard } from "../../context/DashboardContext";

import "./Header.css";

function Header() {
  const { role, setRole, isSuperAdmin, isParty } = useDashboard();

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-brand">BHUMIJA</div>

        <div className="header-divider" />

        <span className="header-module">Mining Management Portal</span>
      </div>

      <div className="header-right">
        {/* Role Switcher - Prototype Only */}
        <div className="header-role-switcher">
          <span className="header-role-switcher-label">Login As</span>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="header-role-select"
          >
            <option value="SUPER_ADMIN">Super Admin</option>

            <option value="PARTY">Party</option>
          </select>
        </div>

        {/* Existing Role Badge */}
        <div className="header-role">
          <span className="header-role-label">
            {isSuperAdmin ? "Super Admin" : "Party"}
          </span>
        </div>

        {/* Existing User */}
        <div className="header-user">
          <div className="header-avatar">{isSuperAdmin ? "SA" : "P"}</div>

          <div className="header-user-info">
            <strong>
              {isSuperAdmin ? "DMG Administrator" : "Organisation User"}
            </strong>

            <span>{isParty ? "Party Account" : "State Administration"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
