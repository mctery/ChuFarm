import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
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

// Wrapper so we can pass inAdmin=true via the Toolpad slot API
function AdminToolbarActions() {
  return <AppToolbarActions inAdmin={true} />;
}

function DrawerContent({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleNav = (path) => {
    navigate(path);
    onClose?.();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo / Brand */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          minHeight: 64,
        }}
      >
        <AgricultureIcon />
        <Box>
          <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
            ChuFarm
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Admin Panel
          </Typography>
        </Box>
      </Box>
      <Divider />

      {/* Nav Items */}
      <List sx={{ flex: 1, py: 1, overflowY: "auto" }}>
        {NAV_ITEMS.map((item, idx) => {
          if (item.divider) return <Divider key={`d-${idx}`} sx={{ my: 0.5 }} />;

          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                onClick={() => handleNav(item.path)}
                selected={active}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.25,
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                    color: "primary.main",
                    "& .MuiListItemIcon-root": { color: "primary.main" },
                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.18) },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{ primary: { variant: "body2", fontWeight: active ? 600 : 400 } }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      {/* Back to user area */}
      <Box sx={{ p: 1.5 }}>
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
      </Box>
    </Box>
  );
}

export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.15)}`,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", gap: 1 }}>
          {/* Hamburger on mobile */}
          {isMobile && (
            <Tooltip title="เมนู">
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                size="small"
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          )}

          {/* Page title placeholder (keeps toolbar balanced) */}
          <Box sx={{ flex: 1 }} />

          <AdminToolbarActions />
        </Toolbar>
      </AppBar>

      {/* Sidebar — permanent on desktop, temporary on mobile */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile temporary drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" },
          }}
        >
          <DrawerContent onClose={handleDrawerToggle} />
        </Drawer>

        {/* Desktop permanent drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
          open
        >
          <DrawerContent />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Toolbar /> {/* spacer for fixed AppBar */}
        <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}
