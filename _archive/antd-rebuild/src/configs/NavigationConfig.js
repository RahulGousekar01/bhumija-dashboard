import {
  BankOutlined,
  BarChartOutlined,
  CarOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  GoldOutlined,
  SettingOutlined,
  WalletOutlined,
} from "@ant-design/icons";

// Side menu of the portal. Only "Dashboard" is part of this prototype.
const navigationConfig = [
  { key: "dashboard", title: "Dashboard", icon: DashboardOutlined },
  { key: "permits", title: "Permits", icon: FileTextOutlined },
  { key: "tripsheets", title: "Trip Sheets", icon: CarOutlined },
  { key: "stock", title: "Stock", icon: GoldOutlined },
  { key: "royalty", title: "Govt. Royalty", icon: BankOutlined },
  { key: "wallet", title: "Wallet", icon: WalletOutlined },
  { key: "reports", title: "Reports", icon: BarChartOutlined },
  { key: "masters", title: "Masters", icon: DatabaseOutlined },
  { key: "settings", title: "Settings", icon: SettingOutlined },
];

export default navigationConfig;
