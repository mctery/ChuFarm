import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Stack,
  Chip,
  Button,
  Skeleton,
  Avatar,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  useTheme,
  LinearProgress,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DevicesIcon from "@mui/icons-material/Devices";
import SensorsIcon from "@mui/icons-material/Sensors";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import CircleIcon from "@mui/icons-material/Circle";
import WbSunnyIcon from "@mui/icons-material/WbSunny";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import OpacityIcon from "@mui/icons-material/Opacity";
import AirIcon from "@mui/icons-material/Air";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountTreeIcon from "@mui/icons-material/AccountTree";

import { SysGetDevices } from "../services/device_service";
import { getUserInfo } from "../services/storage_service";
import { ROUTES } from "../constants/routes";
import apiClient from "../services/apiClient";
import { SEVERITY_COLORS, APP_CONFIG } from "../services/global_variable";

// ── Compact stat pill ──────────────────────────────────────────
function StatPill({ icon, label, value, color, loading, onClick }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={0.75}
      onClick={onClick}
      sx={{
        px: 1.5, py: 0.75, borderRadius: 2,
        bgcolor: alpha(color, 0.1),
        border: `1px solid ${alpha(color, 0.18)}`,
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { bgcolor: alpha(color, 0.16) } : {},
        transition: "background 0.15s",
        minWidth: 90,
      }}
    >
      <Box sx={{ color, display: "flex", fontSize: 16 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.secondary" lineHeight={1} display="block">{label}</Typography>
        {loading
          ? <Skeleton width={24} height={18} />
          : <Typography variant="subtitle2" fontWeight={700} color={color} lineHeight={1.2}>{value}</Typography>
        }
      </Box>
    </Stack>
  );
}

// ── Quick action button ────────────────────────────────────────
function ActionButton({ icon, label, color, onClick }) {
  const theme = useTheme();
  const c = color || theme.palette.primary.main;
  return (
    <Button onClick={onClick} startIcon={icon} size="small" variant="outlined"
      sx={{
        borderColor: alpha(c, 0.3), color: c, borderRadius: 2,
        textTransform: "none", fontWeight: 600, fontSize: "0.8rem", px: 1.5, py: 0.5,
        "&:hover": { bgcolor: alpha(c, 0.06), borderColor: c },
      }}
    >
      {label}
    </Button>
  );
}

// ── Compact device card ────────────────────────────────────────
function DeviceCard({ device, onClick }) {
  const theme = useTheme();
  const online = device.online_status;
  return (
    <Card variant="outlined" onClick={onClick} sx={{
      cursor: "pointer", transition: "border-color 0.15s, box-shadow 0.15s",
      "&:hover": {
        borderColor: "primary.main",
        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
      },
    }}>
      <CardContent sx={{ p: "10px 12px !important" }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: online ? "success.main" : "text.disabled" }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap lineHeight={1.3}>{device.name}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap lineHeight={1.2}>{device.device_id}</Typography>
          </Box>
          <Chip label={online ? "เปิด" : "ปิด"} size="small" color={online ? "success" : "default"}
            variant="outlined" sx={{ height: 20, fontSize: "0.65rem", fontWeight: 700 }} />
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sensorCount, setSensorCount] = useState(0);
  const [weather, setWeather] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const userInfo = getUserInfo();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const devRes = await SysGetDevices();
      if (Array.isArray(devRes)) {
        setDevices(devRes);
        const results = await Promise.all(
          devRes.map((d) => apiClient.get(`/api/sensors/device/${d.device_id}`).catch(() => null))
        );
        setSensorCount(results.reduce((s, r) => s + (r?.data?.data?.length || 0), 0));
      }
    } catch { /* skip */ }

    try {
      const { data } = await apiClient.get(`/api/weather/${APP_CONFIG.WEATHER_CITY}`);
      if (data?.data) setWeather(data.data);
    } catch { /* skip */ }

    if (userInfo?.user_id) {
      try {
        const { data } = await apiClient.get(
          `/api/notifications/user/${userInfo.user_id}`,
          { params: { limit: 30 } }
        );
        setNotifications(data.data || []);
      } catch { /* skip */ }
    }
    setLoading(false);
  }, [userInfo?.user_id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onlineCount = devices.filter((d) => d.online_status).length;
  const offlineCount = devices.length - onlineCount;
  const onlinePct = devices.length ? Math.round((onlineCount / devices.length) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "สวัสดีตอนเช้า";
    if (h < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  // 165px = Toolpad AppBar (~40px) + PageContainer header/title (~80px) + padding top+bottom (~45px)
  return (
    <Box sx={{ height: "calc(100dvh - 165px)", display: "flex", flexDirection: "column", gap: 1.5, overflow: "hidden" }}>

      {/* ── Row 1: Greeting + Stat pills ──────────────────────── */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: "10px 16px !important" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Avatar sx={{
                width: 34, height: 34,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              }}>
                <AgricultureIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                  {greeting()}, {userInfo?.first_name || "ผู้ใช้"}
                </Typography>
                <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                  ChuFarm — ระบบจัดการฟาร์มอัจฉริยะ
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <StatPill icon={<DevicesIcon sx={{ fontSize: 16 }} />} label="อุปกรณ์" value={devices.length}
                color={theme.palette.primary.main} loading={loading} onClick={() => navigate(ROUTES.DEVICES)} />
              <StatPill icon={<WifiIcon sx={{ fontSize: 16 }} />} label="ออนไลน์" value={onlineCount}
                color={theme.palette.success.main} loading={loading} />
              <StatPill icon={<WifiOffIcon sx={{ fontSize: 16 }} />} label="ออฟไลน์" value={offlineCount}
                color={theme.palette.error.main} loading={loading} />
              <StatPill icon={<SensorsIcon sx={{ fontSize: 16 }} />} label="เซ็นเซอร์" value={sensorCount}
                color={theme.palette.warning.main} loading={loading} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Row 2: Main body (flex: 1, min-height: 0) ─────────── */}
      <Grid container spacing={1.5} sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Left: Device status ──────────────────────── */}
        <Grid size={{ xs: 12, md: 7 }} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0 }}>
              <Typography variant="subtitle2" fontWeight={700}>สถานะอุปกรณ์</Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                {!loading && devices.length > 0 && (
                  <Typography variant="caption" color="text.secondary">{onlinePct}% ออนไลน์</Typography>
                )}
                <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate(ROUTES.DEVICES)}
                  sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.25 }}>
                  ทั้งหมด
                </Button>
              </Stack>
            </Stack>

            {!loading && devices.length > 0 && (
              <Box sx={{ px: 2, pb: 1, flexShrink: 0 }}>
                <LinearProgress variant="determinate" value={onlinePct} sx={{
                  height: 3, borderRadius: 2,
                  bgcolor: alpha(theme.palette.success.main, 0.12),
                  "& .MuiLinearProgress-bar": { bgcolor: "success.main", borderRadius: 2 },
                }} />
              </Box>
            )}
            <Divider sx={{ flexShrink: 0 }} />

            {/* Scrollable device grid */}
            <Box sx={{ flex: 1, overflowY: "auto", p: 1.5 }}>
              {loading ? (
                <Grid container spacing={1}>
                  {[1, 2, 3, 4].map((i) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={i}><Skeleton variant="rounded" height={52} /></Grid>
                  ))}
                </Grid>
              ) : devices.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", py: 4 }}>
                  <DevicesIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">ยังไม่มีอุปกรณ์</Typography>
                  <Button size="small" onClick={() => navigate(ROUTES.DEVICES)}
                    sx={{ mt: 1, textTransform: "none" }}>
                    เพิ่มอุปกรณ์แรก
                  </Button>
                </Stack>
              ) : (
                <Grid container spacing={1}>
                  {devices.map((device) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={device._id}>
                      <DeviceCard device={device} onClick={() => navigate(ROUTES.GRIDSTACK(device.device_id))} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Right: Weather + Notifications ──────────── */}
        <Grid size={{ xs: 12, md: 5 }} sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>

          {/* Weather compact ──────────────────────── */}
          <Card sx={{ flexShrink: 0 }}>
            <CardContent sx={{ p: "12px 16px !important" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <WbSunnyIcon sx={{ color: "warning.main", fontSize: 28 }} />
                  {loading ? <Skeleton width={70} height={36} />
                    : weather ? (
                      <Box>
                        <Stack direction="row" alignItems="baseline" spacing={0.5}>
                          <Typography variant="h5" fontWeight={700} lineHeight={1}>
                            {Math.round(weather.main?.temp || 0)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">°C</Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                          {weather.weather?.[0]?.description || "—"}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">ไม่พร้อมใช้งาน</Typography>
                    )}
                </Stack>
                {weather && (
                  <Stack spacing={0.4} alignItems="flex-end">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <OpacityIcon sx={{ fontSize: 13, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary">{weather.main?.humidity}%</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <AirIcon sx={{ fontSize: 13, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">{weather.wind?.speed} m/s</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ThermostatIcon sx={{ fontSize: 13, color: "error.main" }} />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(weather.main?.temp_max)}° / {Math.round(weather.main?.temp_min)}°
                      </Typography>
                    </Stack>
                  </Stack>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Notifications scrollable ─────────────── */}
          <Card sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between"
              sx={{ px: 2, pt: 1.5, pb: 0.75, flexShrink: 0 }}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <NotificationsNoneIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                <Typography variant="subtitle2" fontWeight={700}>แจ้งเตือนล่าสุด</Typography>
              </Stack>
              <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                sx={{ textTransform: "none", fontSize: "0.75rem", py: 0.25 }}>
                ทั้งหมด
              </Button>
            </Stack>
            <Divider sx={{ flexShrink: 0 }} />

            <List disablePadding sx={{ flex: 1, overflowY: "auto" }}>
              {loading ? (
                <Box sx={{ p: 1.5 }}>
                  {[1, 2, 3].map((i) => <Skeleton key={i} height={44} sx={{ mb: 0.5 }} />)}
                </Box>
              ) : notifications.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", py: 3 }}>
                  <Typography variant="body2" color="text.secondary">ไม่มีแจ้งเตือน</Typography>
                </Stack>
              ) : notifications.map((n) => (
                <ListItemButton key={n._id} sx={{
                  py: 0.75, px: 2,
                  bgcolor: n.is_read ? "transparent" : alpha(theme.palette.primary.main, 0.04),
                }}>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={0.75}>
                        {!n.is_read && <CircleIcon sx={{ fontSize: 6, color: "primary.main", flexShrink: 0 }} />}
                        <Typography variant="body2" fontWeight={n.is_read ? 400 : 600} noWrap sx={{ flex: 1 }}>
                          {n.title}
                        </Typography>
                        <Chip label={n.severity || "info"} size="small"
                          color={SEVERITY_COLORS[n.severity] || "default"}
                          sx={{ height: 18, fontSize: "0.6rem", fontWeight: 700 }} />
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.disabled">
                        {new Date(n.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 3: Quick actions ──────────────────────────────── */}
      <Card sx={{ flexShrink: 0 }}>
        <CardContent sx={{ p: "8px 16px !important" }}>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mr: 0.5 }}>
              เมนูลัด:
            </Typography>
            <ActionButton icon={<DevicesIcon sx={{ fontSize: 15 }} />} label="จัดการอุปกรณ์"
              color={theme.palette.primary.main} onClick={() => navigate(ROUTES.DEVICES)} />
            <ActionButton icon={<AccountTreeIcon sx={{ fontSize: 15 }} />} label="ฟาร์ม"
              color={theme.palette.success.main} onClick={() => navigate(ROUTES.FARMS)} />
            <ActionButton icon={<BarChartIcon sx={{ fontSize: 15 }} />} label="วิเคราะห์ข้อมูล"
              color={theme.palette.info.main} onClick={() => navigate(ROUTES.ANALYTICS)} />
            <ActionButton icon={<HelpOutlineIcon sx={{ fontSize: 15 }} />} label="คู่มือ"
              color={theme.palette.text.secondary} onClick={() => navigate(ROUTES.HELP)} />
          </Stack>
        </CardContent>
      </Card>

    </Box>
  );
}
