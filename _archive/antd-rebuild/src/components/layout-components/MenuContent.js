import React from "react";
import { Menu, message } from "antd";
import navigationConfig from "configs/NavigationConfig";

/** Side menu items, shared by the desktop SideNav and the MobileNav drawer. */
const MenuContent = ({ onNavigate }) => (
  <Menu
    mode="inline"
    selectedKeys={["dashboard"]}
    className="side-nav-menu"
    onClick={({ key }) => {
      if (key !== "dashboard") message.info("This module opens in the main portal.");
      onNavigate?.();
    }}
  >
    {navigationConfig.map((item) => {
      const Icon = item.icon;
      return (
        <Menu.Item key={item.key} icon={<Icon />}>
          {item.title}
        </Menu.Item>
      );
    })}
  </Menu>
);

export default MenuContent;
