import { useEffect, useId, useState, type ReactNode } from "react";
import { roleConfig as allRoles, USER_ROLES } from "../../config/roleConfig";
import { useDashboard } from "../../context/DashboardContext";
import type { UserRole } from "../../types/dashboard";
import { Icon, type IconName } from "../ui";
import styles from "./AppShell.module.css";

const MAIN_ID = "bh-main-content";
const COLLAPSE_KEY = "bh-sidenav-collapsed";

/** Mirrors the portal's side menu (NavigationConfig / sideMenuData). */
const NAV_ITEMS: { label: string; icon: IconName; current?: boolean }[] = [
  { label: "Dashboard", icon: "grid", current: true },
  { label: "Permits", icon: "permit" },
  { label: "Trip Sheets", icon: "truck" },
  { label: "Stock", icon: "layers" },
  { label: "ILMS", icon: "pickaxe" },
  { label: "Weighbridge", icon: "scale" },
  { label: "e-Auction", icon: "gavel" },
  { label: "Govt. Royalty", icon: "landmark" },
  { label: "Wallet & Payments", icon: "wallet" },
  { label: "Reports", icon: "report" },
  { label: "Masters", icon: "database" },
];

const readCollapsed = () => {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) !== "false";
  } catch {
    return true;
  }
};

interface AppShellProps {
  children: ReactNode;
}

/**
 * Standalone stand-in for the portal chrome: fixed header plus the
 * collapsible icon side navigation (80px collapsed / 250px expanded, as in
 * the portal's antd Sider). When embedded, the portal's own HeaderNav and
 * SideNav are used and this component is not rendered.
 */
export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const navId = useId();

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, String(collapsed));
    } catch {
      // Preference simply isn't remembered.
    }
  }, [collapsed]);

  return (
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ""}`}>
      <a className={styles.skipLink} href={`#${MAIN_ID}`}>
        Skip to main content
      </a>

      <Header collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} navId={navId} />

      <div className={styles.body}>
        <nav id={navId} className={styles.sidebar} aria-label="Portal menu">
          <ul className={styles.navList}>
            {NAV_ITEMS.map((item) => (
              <li key={item.label}>
                <a
                  className={styles.navItem}
                  href={item.current ? "#top" : "#"}
                  aria-current={item.current ? "page" : undefined}
                  onClick={(event) => {
                    if (!item.current) event.preventDefault();
                  }}
                >
                  <Icon name={item.icon} size={20} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {collapsed && (
                    <span className={styles.tooltip} aria-hidden="true">
                      {item.label}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.navNote}>{collapsed ? "v2.4" : "Bhumija Portal · v2.4"}</p>
        </nav>

        <main id={MAIN_ID} className={styles.main} tabIndex={-1}>
          {children}
          <footer className={styles.footer}>
            <span>© Directorate of Mines &amp; Geology, Government of Goa</span>
            <span>Bhumija Mining Management Portal · Developed by GEL</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function Header({ collapsed, onToggle, navId }: { collapsed: boolean; onToggle: () => void; navId: string }) {
  const { role, setRole, roleLocked, officer, roleConfig } = useDashboard();
  const roleSelectId = useId();

  return (
    <header className={styles.header} id="top">
      <div className={styles.brandGroup}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-controls={navId}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
        >
          <Icon name="menu" size={20} />
        </button>
        <span className={styles.brand}>BHUMIJA</span>
        <span className={styles.divider} aria-hidden="true" />
        <span className={styles.module}>Mining Management Portal</span>
      </div>

      <div className={styles.headerRight}>
        {!roleLocked && (
          <div className={styles.roleSwitcher}>
            <label htmlFor={roleSelectId}>View as</label>
            <select id={roleSelectId} value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              {Object.values(USER_ROLES).map((value) => (
                <option key={value} value={value}>
                  {allRoles[value].label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden="true">
            {roleConfig.user.initials}
          </span>
          <span className={styles.userInfo}>
            <strong>{officer.name}</strong>
            <span>
              {officer.designation} · {officer.office}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
