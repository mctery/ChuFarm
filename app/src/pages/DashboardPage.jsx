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
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
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

import { SysGetDevices } from "../services/device_service";
import { getUserInfo } from "../services/storage_service";
import { ROUTES } from "../constants/routes";
import apiClient from "../services/apiClient";
import { SEVERITY_COLORS, APP_CONFIG } from "../services/global_variable";

function StatCard({ icon, label, value, color, loading, onClick }) {
  return (
    <Card
      sx={{
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { transform: "translateY(-2px)" } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(color, 0.12),
              color,
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={60} height={36} />
            ) : (
              <Typography variant="h4" fontWeight={700}>
                {value}
              </Typography>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

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
        const sensorResults = await Promise.all(
          devRes.map((d) =>
            apiClient.get(`/api/sensors/device/${d.device_id}`).catch(() => null)
          )
        );
        const totalSensors = sensorResults.reduce(
          (sum, res) => sum + (res?.data?.data?.length || 0),
          0
        );
        setSensorCount(totalSensors);
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
          { params: { limit: 5 } }
        );
        setNotifications(data.data || []);
      } catch { /* skip */ }
    }

    setLoading(false);
  }, [userInfo?.user_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onlineCount = devices.filter((d) => d.online_status).length;
  const offlineCount = devices.length - onlineCount;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "สวัสดีตอนเช้า";
    if (hour < 17) return "สวัสดีตอนบ่าย";
    return "สวัสดีตอนเย็น";
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Card
        sx={{
          mb: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 50%, ${theme.palette.success.main} 100%)`,
          color: "white",
          border: "none",
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {greeting()}, {userInfo?.first_name || "ผู้ใช้"}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                ยินดีต้อนรับสู่ระบบจัดการฟาร์มอัจฉริยะ ChuFarm
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(theme.palette.common.white, 0.15),
                display: { xs: "none", sm: "flex" },
              }}
            >
              <AgricultureIcon sx={{ fontSize: 32 }} />
            </Avatar>
          </Stack>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<DevicesIcon />}
            label="อุปกรณ์ทั้งหมด"
            value={devices.length}
            color={theme.palette.primary.main}
            loading={loading}
            onClick={() => navigate(ROUTES.DEVICES)}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<WifiIcon />}
            label="ออนไลน์"
            value={onlineCount}
            color={theme.palette.success.main}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<WifiOffIcon />}
            label="ออฟไลน์"
            value={offlineCount}
            color={theme.palette.error.main}
            loading={loading}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            icon={<SensorsIcon />}
            label="เซ็นเซอร์"
            value={sensorCount}
            color={theme.palette.warning.main}
            loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Left column */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Device List */}
          {!loading && devices.length > 0 && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ px: 2.5, pt: 2, pb: 1 }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    สถานะอุปกรณ์
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate(ROUTES.DEVICES)}
                  >
                    ดูทั้งหมด
                  </Button>
                </Stack>
                <Grid container spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
                  {devices.slice(0, 6).map((device) => (
                    <Grid size={{ xs: 12, sm: 6 }} key={device._id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                        }}
                        onClick={() =>
                          navigate(ROUTES.GRIDSTACK(device.device_id))
                        }
                      >
                        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography variant="body2" fontWeight={600} noWrap>
                                {device.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {device.device_id}
                              </Typography>
                            </Box>
                            <Chip
                              icon={
                                <CircleIcon
                                  sx={{
                                    fontSize: "8px !important",
                                    color: device.online_status
                                      ? "success.main"
                                      : "text.disabled",
                                  }}
                                />
                              }
                              label={device.online_status ? "ON" : "OFF"}
                              size="small"
                              variant="outlined"
                              color={device.online_status ? "success" : "default"}
                              sx={{ height: 24, fontSize: "0.7rem" }}
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                เมนูลัด
              </Typography>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: "pointer",
                      "&:hover": { borderColor: "primary.main", bgcolor: alpha(theme.palette.primary.main, 0.02) },
                    }}
                    onClick={() => navigate(ROUTES.DEVICES)}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: "primary.main", width: 40, height: 40 }}>
                          <DevicesIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>จัดการอุปกรณ์</Typography>
                          <Typography variant="caption" color="text.secondary">ดู เพิ่ม แก้ไขอุปกรณ์ IoT</Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: "pointer",
                      "&:hover": { borderColor: "info.main", bgcolor: alpha(theme.palette.info.main, 0.02) },
                    }}
                    onClick={() => navigate(ROUTES.HELP)}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: "info.main", width: 40, height: 40 }}>
                          <HelpOutlineIcon fontSize="small" />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>คู่มือการใช้งาน</Typography>
                          <Typography variant="caption" color="text.secondary">วิธีเริ่มต้นและ FAQ</Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Right column: Weather + Notifications */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Weather */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <WbSunnyIcon sx={{ color: "warning.main", fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={700}>สภาพอากาศ</Typography>
              </Stack>
              {weather ? (
                <Box>
                  <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1.5 }}>
                    <Typography variant="h3" fontWeight={700} lineHeight={1}>
                      {Math.round(weather.main?.temp || 0)}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">°C</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, textTransform: "capitalize" }}>
                    {weather.weather?.[0]?.description || "—"}
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <OpacityIcon sx={{ fontSize: 16, color: "info.main" }} />
                      <Typography variant="caption" color="text.secondary">ความชื้น</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ ml: "auto" }}>
                        {weather.main?.humidity || 0}%
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AirIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                      <Typography variant="caption" color="text.secondary">ลม</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ ml: "auto" }}>
                        {weather.wind?.speed || 0} m/s
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <ThermostatIcon sx={{ fontSize: 16, color: "error.main" }} />
                      <Typography variant="caption" color="text.secondary">สูงสุด/ต่ำสุด</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ ml: "auto" }}>
                        {Math.round(weather.main?.temp_max || 0)}° / {Math.round(weather.main?.temp_min || 0)}°
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
              ) : loading ? (
                <Stack spacing={1}>
                  <Skeleton width="40%" height={48} />
                  <Skeleton width="60%" />
                  <Skeleton width="100%" />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  ไม่สามารถโหลดข้อมูลสภาพอากาศ
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ px: 2.5, pt: 2, pb: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <NotificationsNoneIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                  <Typography variant="subtitle2" fontWeight={700}>แจ้งเตือนล่าสุด</Typography>
                </Stack>
              </Stack>
              <List disablePadding>
                {notifications.length === 0 ? (
                  <ListItem>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: "center", width: "100%" }}>
                      ไม่มีแจ้งเตือน
                    </Typography>
                  </ListItem>
                ) : (
                  notifications.map((n) => (
                    <ListItemButton key={n._id} sx={{ py: 1, px: 2.5 }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {!n.is_read && <CircleIcon sx={{ fontSize: 6, color: "primary.main" }} />}
                            <Typography variant="body2" fontWeight={n.is_read ? 400 : 600} noWrap>
                              {n.title}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.disabled">
                            {new Date(n.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                          </Typography>
                        }
                      />
                      <Chip
                        label={n.severity || "info"}
                        size="small"
                        color={SEVERITY_COLORS[n.severity] || "default"}
                        sx={{ height: 18, fontSize: "0.6rem", ml: 1 }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
