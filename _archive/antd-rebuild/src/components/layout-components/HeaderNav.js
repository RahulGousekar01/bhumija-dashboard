import React from "react";
import { Avatar, Button, Layout, Select, Tag } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { ROLES, ROLE_LABELS, ROLE_USERS } from "constants/DashboardConstant";
import { useRole } from "context/RoleContext";

const { Header } = Layout;

const HeaderNav = ({ collapsed, onToggle, isMobile }) => {
  const { role, setRole } = useRole();
  const user = ROLE_USERS[role];

  return (
    <Header className="app-header">
      <div className="header-left">
        <Button
          type="text"
          className="nav-toggle"
          aria-label={isMobile ? "Open menu" : collapsed ? "Expand menu" : "Collapse menu"}
          aria-expanded={isMobile ? undefined : !collapsed}
          icon={collapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
        />
        <img className="header-logo" src={`${process.env.PUBLIC_URL}/img/bhumija-logo.png`} alt="Bhumija" />
      </div>

      <div className="header-right">
        {/* Prototype only: lets reviewers see both roles. */}
        <div className="role-switcher">
          <label htmlFor="login-as">Login As</label>
          <Select id="login-as" value={role} onChange={setRole} size="small" style={{ width: 130 }}>
            {Object.values(ROLES).map((value) => (
              <Select.Option key={value} value={value}>
                {ROLE_LABELS[value]}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="header-user">
          <Avatar className="header-avatar">{user.initials}</Avatar>
          <div className="header-user-info">
            <strong>{user.name}</strong>
            <span>{user.subtitle}</span>
          </div>
          <Tag className="header-role-tag">{ROLE_LABELS[role]}</Tag>
        </div>
      </div>
    </Header>
  );
};

export default HeaderNav;
