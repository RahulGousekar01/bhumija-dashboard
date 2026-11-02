import React from "react";
import { Drawer } from "antd";
import MenuContent from "./MenuContent";

/** Below the lg breakpoint the side menu slides in from the left. */
const MobileNav = ({ open, onClose }) => (
  <Drawer
    className="mobile-nav"
    placement="left"
    width={260}
    visible={open}
    onClose={onClose}
    closable={false}
    bodyStyle={{ padding: 0 }}
    title={<img src={`${process.env.PUBLIC_URL}/img/bhumija-logo.png`} alt="Bhumija" height={28} />}
  >
    <MenuContent onNavigate={onClose} />
  </Drawer>
);

export default MobileNav;
