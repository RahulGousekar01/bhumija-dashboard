import React from "react";
import { Layout } from "antd";
import MenuContent from "./MenuContent";

const { Sider } = Layout;

export const SIDE_NAV_WIDTH = 250;
export const SIDE_NAV_COLLAPSED_WIDTH = 80;

/**
 * Desktop side navigation. Collapses to an icon-only rail (80px) and expands
 * to full labels (250px); antd animates the width and shows a tooltip for
 * each icon while collapsed.
 */
const SideNav = ({ collapsed }) => (
  <Sider
    className="side-nav"
    theme="light"
    width={SIDE_NAV_WIDTH}
    collapsedWidth={SIDE_NAV_COLLAPSED_WIDTH}
    collapsed={collapsed}
    trigger={null}
    collapsible
  >
    <MenuContent />
  </Sider>
);

export default SideNav;
