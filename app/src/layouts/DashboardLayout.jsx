import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Outlet, useNavigate } from "react-router";
import { DashboardLayout } from "@toolpad/core/DashboardLayout";
import { PageContainer } from "@toolpad/core/PageContainer";
import {
  Stack,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Popover,
  List,
  ListItem,
  ListItemButton,
  Chip,
  Button,
  alpha,
  useTheme,
} from "@mui/material";
import { useSnackbar } from "notistack";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import CircleIcon from "@mui/icons-material/Circle";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { SysSignout } from "../services/auth_service";
import { getUserInfo } from "../services/storage_service";
import { useThemeMode } from "../App";
import ErrorBoundary from "../components/ErrorBoundary";
import apiClient from "../services/apiClient";
import { ROUTES } from "../constants/routes";

const SEVERITY_COLORS = {
  critical: "error",
  warning: "warning",
  info: "info",
};

function ToolbarActions() {
  const { enqueueSnackbar } = useSnackbar();
  const { mode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const navigate = useNavigate();
  const white = theme.palette.common.white;
  const userInfo = getUserInfo();
  const displayName = userInfo?.first_name || "ผู้ใช้";
  const initials =
    (userInfo?.first_name?.[0] || "") + (userInfo?.last_name?.[0] || "");

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifAnchor, setNotifAnchor] = useState(null);

  // Profile menu state
  const [profileAnchor, setProfileAnchor] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!userInfo?.user_id) return;
    try {
      const { data } = await apiClient.get(
        `/api/notifications/user/${userInfo.user_id}/unread-count`
      );
      setUnreadCount(data.data?.count || 0);
    } catch {
      // silent
    }
  }, [userInfo?.user_id]);

  const fetchNotifications = useCallback(async () => {
    if (!userInfo?.user_id) return;
    try {
      const { data } = await apiClient.get(
        `/api/notifications/user/${userInfo.user_id}`,
        { params: { limit: 8 } }
      );
      setNotifications(data.data || []);
    } catch {
      // silent
    }
  }, [userInfo?.user_id]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleOpenNotif = (e) => {
    setNotifAnchor(e.currentTarget);
    fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    if (!userInfo?.user_id) return;
    try {
      await apiClient.put(
        `/api/notifications/user/${userInfo.user_id}/read-all`
      );
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch {
      enqueueSnackbar("ไม่สามารถอ่านแจ้งเตือนได้", { variant: "error" });
    }
  };

  const handleLogout = () => {
    setProfileAnchor(null);
    enqueueSnackbar("ออกจากระบบเรียบร้อย", {
      variant: "info",
      autoHideDuration: 2000,
    });
    SysSignout();
  };

  const iconBtnSx = {
    color: alpha(white, 0.85),
    "&:hover": {
      color: white,
      bgcolor: alpha(white, 0.12),
    },
  };

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {/* Theme toggle */}
      <Tooltip title={mode === "light" ? "โหมดมืด" : "โหมดสว่าง"}>
        <IconButton size="small" onClick={toggleTheme} sx={iconBtnSx}>
          {mode === "light" ? (
            <DarkModeIcon fontSize="small" />
          ) : (
            <LightModeIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* Notification bell */}
      <Tooltip title="แจ้งเตือน">
        <IconButton size="small" onClick={handleOpenNotif} sx={iconBtnSx}>
          <Badge
            badgeContent={unreadCount}
            color="error"
            max={99}
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.65rem",
                height: 16,
                minWidth: 16,
              },
            }}
          >
            <NotificationsNoneIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Notification Popover */}
      <Popover
        open={Boolean(notifAnchor)}
        anchorEl={notifAnchor}
        onClose={() => setNotifAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 480,
              mt: 1,
              borderRadius: 2,
              overflow: "hidden",
            },
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2, py: 1.5 }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            แจ้งเตือน
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
              onClick={handleMarkAllRead}
              sx={{ textTransform: "none", fontSize: "0.75rem" }}
            >
              อ่านทั้งหมด
            </Button>
          )}
        </Stack>
        <Divider />
        <List disablePadding sx={{ maxHeight: 340, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <ListItem>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ py: 3, textAlign: "center", width: "100%" }}
              >
                ไม่มีแจ้งเตือน
              </Typography>
            </ListItem>
          ) : (
            notifications.map((n) => (
              <ListItemButton
                key={n._id}
                sx={{
                  py: 1.5,
                  px: 2,
                  bgcolor: n.is_read
                    ? "transparent"
                    : alpha(theme.palette.primary.main, 0.04),
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
                onClick={async () => {
                  if (!n.is_read) {
                    try {
                      await apiClient.put(`/api/notifications/${n._id}/read`);
                      setUnreadCount((c) => Math.max(0, c - 1));
                      setNotifications((prev) =>
                        prev.map((item) =>
                          item._id === n._id
                            ? { ...item, is_read: true }
                            : item
                        )
                      );
                    } catch {
                      // silent
                    }
                  }
                }}
              >
                <Stack spacing={0.5} sx={{ width: "100%" }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    {!n.is_read && (
                      <CircleIcon
                        sx={{
                          fontSize: 8,
                          color: "primary.main",
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      fontWeight={n.is_read ? 400 : 600}
                      noWrap
                      sx={{ flex: 1 }}
                    >
                      {n.title}
                    </Typography>
                    <Chip
                      label={n.severity || "info"}
                      size="small"
                      color={SEVERITY_COLORS[n.severity] || "default"}
                      sx={{ height: 18, fontSize: "0.65rem" }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {n.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {new Date(n.createdAt).toLocaleString("th-TH", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Typography>
                </Stack>
              </ListItemButton>
            ))
          )}
        </List>
        <Divider />
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Button
            size="small"
            fullWidth
            onClick={() => {
              setNotifAnchor(null);
              navigate(ROUTES.NOTIFICATIONS);
            }}
            sx={{ textTransform: "none", fontSize: "0.8rem" }}
          >
            ดูแจ้งเตือนทั้งหมด
          </Button>
        </Box>
      </Popover>

      {/* Profile chip → dropdown */}
      <Chip
        avatar={
          <Avatar
            sx={{
              bgcolor: alpha(white, 0.2),
              color: white,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials || <PersonIcon sx={{ fontSize: 16 }} />}
          </Avatar>
        }
        label={displayName}
        variant="outlined"
        size="small"
        onClick={(e) => setProfileAnchor(e.currentTarget)}
        sx={{
          color: white,
          borderColor: alpha(white, 0.3),
          cursor: "pointer",
          "& .MuiChip-label": { fontWeight: 500, fontSize: "0.8rem" },
          "&:hover": {
            borderColor: alpha(white, 0.6),
            bgcolor: alpha(white, 0.08),
          },
        }}
      />

      {/* Profile Menu */}
      <Menu
        anchorEl={profileAnchor}
        open={Boolean(profileAnchor)}
        onClose={() => setProfileAnchor(null)}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: { width: 220, mt: 1, borderRadius: 2 },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {userInfo?.first_name} {userInfo?.last_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {userInfo?.email}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={userInfo?.role === "admin" ? "Admin" : "User"}
              size="small"
              color={userInfo?.role === "admin" ? "primary" : "default"}
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          </Box>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            navigate(ROUTES.SETTINGS);
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>ตั้งค่า</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setProfileAnchor(null);
            toggleTheme();
          }}
        >
          <ListItemIcon>
            {mode === "light" ? (
              <DarkModeIcon fontSize="small" />
            ) : (
              <LightModeIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText>
            {mode === "light" ? "โหมดมืด" : "โหมดสว่าง"}
          </ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>ออกจากระบบ</ListItemText>
        </MenuItem>
      </Menu>
    </Stack>
  );
}

export default function Layout() {
  return (
    <DashboardLayout slots={{ toolbarActions: ToolbarActions }}>
      <PageContainer title="" sx={{ maxWidth: "100% !important" }}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </PageContainer>
    </DashboardLayout>
  );
}
