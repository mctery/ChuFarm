import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { isAdmin } from "../services/permission_service";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Divider,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import DevicesIcon from "@mui/icons-material/Devices";
import SensorsIcon from "@mui/icons-material/Sensors";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ListAltIcon from "@mui/icons-material/ListAlt";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AgricultureIcon from "@mui/icons-material/Agriculture";

import AppToolbarActions from "../components/AppToolbarActions";
import ErrorBoundary from "../components/ErrorBoundary";
import { ROUTES } from "../constants/routes";

const DRAWER_WIDTH = 260;
const MINI_WIDTH = 64;
const TRANSITION = "width 0.2s ease, min-width 0.2s ease";

const NAV_ITEMS = [
  { path: ROUTES.ADMIN_DASHBOARD, label: "ภาพรวมระบบ", icon: <DashboardIcon fontSize="small" /> },
  { divider: true },
  { path: ROUTES.ADMIN_USERS, label: "ผู้ใช้งาน", icon: <PeopleIcon fontSize="small" /> },
  { path: ROUTES.ADMIN_DEVICES, label: "อุปกรณ์", icon: <DevicesIcon fontSize="small" /> },
  { path: ROUTES.ADMIN_SENSORS, label: "เซ็นเซอร์", icon: <SensorsIcon fontSize="small" /> },
  { path: ROUTES.ADMIN_NOTIFICATIONS, label: "การแจ้งเตือน", icon: <NotificationsIcon fontSize="small" /> },
  { divider: true },
  { path: ROUTES.ADMIN_AUDIT_LOGS, label: "Audit Logs", icon: <AssignmentIcon fontSize="small" /> },
  { path: ROUTES.ADMIN_DEVICE_LOGS, label: "Device Logs", icon: <ListAltIcon fontSize="small" /> },
  { divider: true },
  { path: ROUTES.ADMIN_MENUS, label: "จัดการเมนู", icon: <MenuBookIcon fontSize="small" /> },
  { path: ROUTES.ADMIN_SETTINGS, label: "ตั้งค่าระบบ", icon: <SettingsIcon fontSize="small" /> },
];

function AdminToolbarActions() {
  return <AppToolbarActions inAdmin={true} />;
}

function usePageTitle() {
  const location = useLocation();
  const item = NAV_ITEMS.find((n) => !n.divider && n.path === location.pathname);
  return item?.label || "Admin Panel";
}

function DrawerContent({ collapsed = false, onClose, onToggleCollapse }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Brand Header */}
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 1,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          minHeight: 64,
          transition: "padding 0.2s ease",
        }}
      >
        {!collapsed && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, overflow: "hidden" }}>
            <AgricultureIcon sx={{ flexShrink: 0 }} />
            <Box sx={{ overflow: "hidden" }}>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2} noWrap>
                ChuFarm
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
                Admin Panel
              </Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Tooltip title="ChuFarm Admin" placement="right">
            <AgricultureIcon />
          </Tooltip>
        )}
        {/* Collapse toggle — desktop only (no onClose prop = desktop) */}
        {!onClose && (
          <Tooltip title={collapsed ? "ขยายเมนู" : "ย่อเมนู"} placement="right">
            <IconButton
              size="small"
              onClick={onToggleCollapse}
              sx={{ color: alpha(theme.palette.common.white, 0.8), "&:hover": { color: "white", bgcolor: alpha(theme.palette.common.white, 0.15) } }}
            >
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Divider />

      {/* Nav Items */}
      <List sx={{ flex: 1, py: 1, overflowY: "auto", overflowX: "hidden" }}>
        {NAV_ITEMS.map((item, idx) => {
          if (item.divider) return <Divider key={`d-${idx}`} sx={{ my: 0.5 }} />;

          const active = location.pathname === item.path;
          const btn = (
            <ListItem key={item.path} disablePadding sx={{ px: collapsed ? 0.5 : 1 }}>
              <ListItemButton
                onClick={() => handleNav(item.path)}
                selected={active}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.25,
                  justifyContent: collapsed ? "center" : "flex-start",
                  minHeight: 40,
                  px: collapsed ? 1 : 1.5,
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, mr: collapsed ? 0 : undefined, justifyContent: "center" }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { variant: "body2", fontWeight: active ? 600 : 400, noWrap: true } }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );

          return collapsed ? (
            <Tooltip key={item.path} title={item.label} placement="right">
              <span>{btn}</span>
            </Tooltip>
          ) : btn;
        })}
      </List>

      <Divider />
      {/* Back to user area */}
      <Box sx={{ p: collapsed ? 0.5 : 1.5 }}>
        {collapsed ? (
          <Tooltip title="กลับหน้าผู้ใช้" placement="right">
            <ListItemButton
              onClick={() => handleNav(ROUTES.DASHBOARD)}
              sx={{ borderRadius: 1.5, justifyContent: "center", px: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                <ArrowBackIcon fontSize="small" />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        ) : (
          <ListItemButton
            onClick={() => handleNav(ROUTES.DASHBOARD)}
            sx={{ borderRadius: 1.5, color: "text.secondary" }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <ArrowBackIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="กลับหน้าผู้ใช้"
              slotProps={{ primary: { variant: "body2" } }}
            />
          </ListItemButton>
        )}
      </Box>
    </Box>
  );
}

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pageTitle = usePageTitle();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const drawerWidth = collapsed ? MINI_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
          transition: TRANSITION,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", gap: 1 }}>
          {isMobile && (
            <Tooltip title="เมนู">
              <IconButton color="inherit" edge="start" onClick={() => setMobileOpen((p) => !p)} size="small">
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant="subtitle1" fontWeight={600} color="inherit" noWrap sx={{ flex: 1 }}>
            {pageTitle}
          </Typography>
          <AdminToolbarActions />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          transition: TRANSITION,
        }}
      >
        {/* Mobile temporary */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          <DrawerContent onClose={() => setMobileOpen(false)} />
        </Drawer>

        {/* Desktop permanent */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme.palette.divider}`,
              overflowX: "hidden",
              transition: TRANSITION,
            },
          }}
          open
        >
          <DrawerContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((p) => !p)} />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          transition: TRANSITION,
        }}
      >
        <Toolbar />
        <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
