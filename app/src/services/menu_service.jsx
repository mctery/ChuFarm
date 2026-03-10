import HomeIcon from "@mui/icons-material/Home";
import DevicesIcon from "@mui/icons-material/Devices";
import InfoIcon from "@mui/icons-material/Info";
import HelpIcon from "@mui/icons-material/Help";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PeopleIcon from "@mui/icons-material/People";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import SensorsIcon from "@mui/icons-material/Sensors";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ListAltIcon from "@mui/icons-material/ListAlt";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import BarChartIcon from "@mui/icons-material/BarChart";

import { getUserInfo } from "./storage_service";

/** Map icon name (from DB) → MUI icon component */
const ICON_MAP = {
  Home: <HomeIcon />,
  Dashboard: <DashboardIcon />,
  Devices: <DevicesIcon />,
  Info: <InfoIcon />,
  Help: <HelpIcon />,
  AdminPanelSettings: <AdminPanelSettingsIcon />,
  People: <PeopleIcon />,
  Settings: <SettingsIcon />,
  Sensors: <SensorsIcon />,
  Assignment: <AssignmentIcon />,
  ListAlt: <ListAltIcon />,
  Notifications: <NotificationsIcon />,
  MenuBook: <MenuBookIcon />,
  BarChart: <BarChartIcon />,
};

const ADMIN_KEY = "admin";

/**
 * Get menus from localStorage (populated after login).
 */
export function getMenusFromStorage() {
  const info = getUserInfo();
  return info?.menus || [];
}

/**
 * Convert a single DB menu item → Toolpad navigation item.
 * parentPath strips the parent prefix so children get relative segments.
 */
function toNavItem(menu, parentPath = "") {
  let segment = menu.path?.replace(/^\//, "") || menu.key;

  // For child menus, strip the parent path prefix so Toolpad gets a relative segment
  // e.g. parent "admin" + child path "/admin/dashboard" → child segment "dashboard"
  if (parentPath && segment.startsWith(parentPath + "/")) {
    segment = segment.slice(parentPath.length + 1);
  }

  const item = {
    segment,
    title: menu.name,
    icon: ICON_MAP[menu.icon] || <DashboardIcon />,
  };

  if (menu.children && menu.children.length > 0) {
    const currentPath = menu.path?.replace(/^\//, "") || menu.key;
    item.children = menu.children.map((child) => toNavItem(child, currentPath));
  }

  return item;
}

/**
 * Build Toolpad-compatible navigation array from DB menus hierarchy.
 * Only includes regular (non-admin) menus — admin area has its own layout.
 */
export function buildNavigation(menus) {
  if (!Array.isArray(menus) || menus.length === 0) {
    return [
      { kind: "header", title: "เมนูหลัก" },
      { segment: "dashboard", title: "หน้าหลัก", icon: <HomeIcon /> },
    ];
  }

  const regularMenus = menus.filter((m) => m.key !== ADMIN_KEY);

  return [
    { kind: "header", title: "เมนูหลัก" },
    ...regularMenus.map((m) => toNavItem(m)),
  ];
}

/**
 * Get navigation from storage — called by App.jsx.
 */
export function getNavigation() {
  const menus = getMenusFromStorage();
  return buildNavigation(menus);
}
