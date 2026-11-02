import React, { useState } from "react";
import { Grid, Layout } from "antd";
import HeaderNav from "components/layout-components/HeaderNav";
import SideNav from "components/layout-components/SideNav";
import MobileNav from "components/layout-components/MobileNav";
import Footer from "components/layout-components/Footer";
import { RoleProvider } from "context/RoleContext";
import Dashboard from "views/dashboard";

const { Content } = Layout;
const { useBreakpoint } = Grid;

/** Portal shell: header, collapsible side navigation, content and footer. */
const AppLayout = () => {
  const screens = useBreakpoint();
  // Same rule as the portal: side nav below the lg breakpoint becomes a drawer.
  const isMobile = screens.lg === false;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <Layout className="app-root">
      <HeaderNav
        collapsed={collapsed}
        isMobile={isMobile}
        onToggle={() => (isMobile ? setMobileNavOpen(true) : setCollapsed((value) => !value))}
      />
      <Layout className="app-container">
        {!isMobile && <SideNav collapsed={collapsed} />}
        <Layout className="app-layout">
          <Content className="app-content">
            <Dashboard />
          </Content>
          <Footer />
        </Layout>
      </Layout>
      {isMobile && <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />}
    </Layout>
  );
};

const App = () => (
  <RoleProvider>
    <AppLayout />
  </RoleProvider>
);

export default App;
