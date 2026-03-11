import { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  IconButton,
  LinearProgress,
  Skeleton,
  Avatar,
  alpha,
  useTheme,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import BatteryAlertIcon from "@mui/icons-material/BatteryAlert";
import WifiIcon from "@mui/icons-material/Wifi";
import SignalWifiOffIcon from "@mui/icons-material/SignalWifiOff";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RouterIcon from "@mui/icons-material/Router";
import MemoryIcon from "@mui/icons-material/Memory";
import SystemUpdateAltIcon from "@mui/icons-material/SystemUpdateAlt";
import WifiTetheringIcon from "@mui/icons-material/WifiTethering";
import CircleIcon from "@mui/icons-material/Circle";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import PowerOffIcon from "@mui/icons-material/PowerOff";
import TerminalIcon from "@mui/icons-material/Terminal";
import SettingsRemoteIcon from "@mui/icons-material/SettingsRemote";

import { SysGetDeviceHealth } from "../services/device_service";
import { SocketConnect, SocketSubscribe } from "../services/socket_service";
import { HEALTH_THRESHOLDS } from "../services/global_variable";

function formatUptime(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} วัน ${h} ชม.`;
  if (h > 0) return `${h} ชม. ${m} นาที`;
  return `${m} นาที`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

function InfoRow({ label, value, icon, color }) {
  const theme = useTheme();
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 1 }}>
      <Avatar
        sx={{
          width: 30,
          height: 30,
          bgcolor: alpha(color || theme.palette.primary.main, 0.1),
          color: color || "primary.main",
          "& .MuiSvgIcon-root": { fontSize: 16 },
        }}
      >
        {icon}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600} noWrap>
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

function EventItem({ event }) {
  const theme = useTheme();
  const isOnline = event.event === "online";
  const isOffline = event.event === "offline";
  const isCmdSent = event.event === "command_sent";

  const color = isOnline
    ? theme.palette.success.main
    : isOffline
    ? theme.palette.text.disabled
    : theme.palette.info.main;

  const label = isOnline
    ? "เชื่อมต่อ"
    : isOffline
    ? "ตัดการเชื่อมต่อ"
    : isCmdSent
    ? "ส่งคำสั่ง"
    : event.event;

  const Icon = isOnline
    ? PowerSettingsNewIcon
    : isOffline
    ? PowerOffIcon
    : TerminalIcon;

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.75 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(color, 0.12), color, mt: 0.25 }}>
        <Icon sx={{ fontSize: 14 }} />
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600} color={color}>
          {label}
          {isCmdSent && event.metadata?.command && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
              ({event.metadata.command})
            </Typography>
          )}
        </Typography>
        <Typography variant="caption" color="text.disabled">
          {formatDate(event.createdAt)}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function DeviceHealthDrawer({ open, device, onClose }) {
  const theme = useTheme();
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [liveUpdated, setLiveUpdated] = useState(false);

  const fetchHealth = useCallback(async () => {
    if (!device?._id) return;
    setLoading(true);
    const data = await SysGetDeviceHealth(device._id);
    setHealth(data);
    setLoading(false);
  }, [device?._id]);

  useEffect(() => {
    if (open) {
      setLiveUpdated(false);
      fetchHealth();
    } else {
      setHealth(null);
      setLiveUpdated(false);
    }
  }, [open, fetchHealth]);

  // Subscribe to real-time health + status updates
  useEffect(() => {
    if (!open || !device?.device_id) return;

    let unsubHealth = null;
    let unsubStatus = null;

    async function subscribe() {
      await SocketConnect();

      unsubHealth = await SocketSubscribe(
        `device/${device.device_id}/health`,
        (payload) => {
          setHealth((prev) => ({
            ...prev,
            ...(payload.battery !== undefined && { battery_level: Number(payload.battery) }),
            ...(payload.rssi !== undefined && { signal_strength: Number(payload.rssi) }),
            ...(payload.firmware !== undefined && { firmware_version: String(payload.firmware) }),
            ...(payload.hardware !== undefined && { hardware_version: String(payload.hardware) }),
            ...(payload.uptime !== undefined && { uptime_seconds: Number(payload.uptime) }),
            ...(payload.ip !== undefined && { ip_address: String(payload.ip) }),
            ...(payload.mac !== undefined && { mac_address: String(payload.mac) }),
          }));
          setLiveUpdated(true);
        }
      );

      unsubStatus = await SocketSubscribe(
        "device_status",
        (payload) => {
          if (payload.device_id !== device.device_id) return;
          setHealth((prev) => ({
            ...prev,
            online_status: payload.online_status,
            ...(payload.last_seen && { last_seen: payload.last_seen }),
          }));
        }
      );
    }

    subscribe().catch(console.warn);

    return () => {
      unsubHealth?.();
      unsubStatus?.();
    };
  }, [open, device?.device_id]);

  const batteryLevel = health?.battery_level;
  const signalStrength = health?.signal_strength;
  const batteryLow = typeof batteryLevel === "number" && batteryLevel < HEALTH_THRESHOLDS.BATTERY_LOW;
  const signalWeak = typeof signalStrength === "number" && signalStrength < HEALTH_THRESHOLDS.SIGNAL_WEAK;

  const batteryColor = batteryLow
    ? theme.palette.error.main
    : batteryLevel > 50
    ? theme.palette.success.main
    : theme.palette.warning.main;

  const signalLabel =
    typeof signalStrength !== "number"
      ? "—"
      : signalStrength >= -40
      ? `${signalStrength} dBm (ดีมาก)`
      : signalStrength >= -70
      ? `${signalStrength} dBm (ดี)`
      : signalStrength >= -90
      ? `${signalStrength} dBm (อ่อน)`
      : `${signalStrength} dBm (แย่มาก)`;

  const isOnline = health?.online_status;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 380 } } } }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          bgcolor: "primary.main",
          color: "primary.contrastText",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <SettingsRemoteIcon />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={700} noWrap>
            {device?.name || "อุปกรณ์"}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
            {device?.device_id}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Chip
            icon={<CircleIcon sx={{ fontSize: "8px !important" }} />}
            label={isOnline ? "ออนไลน์" : "ออฟไลน์"}
            size="small"
            color={isOnline ? "success" : "default"}
            sx={{ height: 22, "& .MuiChip-icon": { color: "inherit" } }}
          />
          {liveUpdated && (
            <Tooltip title="ข้อมูล real-time">
              <Chip
                icon={<CircleIcon sx={{ fontSize: "8px !important", animation: "pulse 1.5s infinite" }} />}
                label="Live"
                size="small"
                color="warning"
                sx={{
                  height: 22,
                  "& .MuiChip-icon": { color: "inherit" },
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.3 },
                  },
                }}
              />
            </Tooltip>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: "primary.contrastText" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ overflowY: "auto", flex: 1 }}>
        {/* Battery & Signal */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
            สถานะฮาร์ดแวร์
          </Typography>

          {loading ? (
            <Stack spacing={1.5} sx={{ mt: 1.5 }}>
              <Skeleton height={48} sx={{ borderRadius: 1 }} />
              <Skeleton height={48} sx={{ borderRadius: 1 }} />
            </Stack>
          ) : (
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {/* Battery */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: batteryLow ? "error.light" : "divider",
                  bgcolor: batteryLow ? alpha(theme.palette.error.main, 0.04) : "transparent",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(batteryColor, 0.12), color: batteryColor }}>
                    {batteryLow ? <BatteryAlertIcon sx={{ fontSize: 16 }} /> : <BatteryFullIcon sx={{ fontSize: 16 }} />}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    แบตเตอรี่
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color={batteryColor}>
                    {typeof batteryLevel === "number" ? `${batteryLevel}%` : "—"}
                  </Typography>
                  {batteryLow && <Chip label="ต่ำ" size="small" color="error" sx={{ height: 18 }} />}
                </Stack>
                {typeof batteryLevel === "number" && (
                  <LinearProgress
                    variant="determinate"
                    value={batteryLevel}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(batteryColor, 0.15),
                      "& .MuiLinearProgress-bar": { bgcolor: batteryColor, borderRadius: 3 },
                    }}
                  />
                )}
              </Box>

              {/* Signal */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: signalWeak ? "warning.light" : "divider",
                  bgcolor: signalWeak ? alpha(theme.palette.warning.main, 0.04) : "transparent",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: alpha(signalWeak ? theme.palette.warning.main : theme.palette.info.main, 0.12), color: signalWeak ? "warning.main" : "info.main" }}>
                    {signalWeak ? <SignalWifiOffIcon sx={{ fontSize: 16 }} /> : <WifiIcon sx={{ fontSize: 16 }} />}
                  </Avatar>
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>
                    สัญญาณ WiFi
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color={signalWeak ? "warning.main" : "text.primary"}>
                    {signalLabel}
                  </Typography>
                  {signalWeak && <Chip label="อ่อน" size="small" color="warning" sx={{ height: 18 }} />}
                </Stack>
              </Box>
            </Stack>
          )}
        </Box>

        <Divider />

        {/* Device Info */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
            ข้อมูลอุปกรณ์
          </Typography>
          {loading ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {[...Array(5)].map((_, i) => <Skeleton key={i} height={44} />)}
            </Stack>
          ) : (
            <Stack divider={<Divider />} sx={{ mt: 0.5 }}>
              <InfoRow label="เชื่อมต่อล่าสุด" value={formatDate(health?.last_seen)} icon={<AccessTimeIcon />} />
              <InfoRow label="Uptime" value={formatUptime(health?.uptime_seconds)} icon={<WifiTetheringIcon />} color={theme.palette.success.main} />
              <InfoRow label="Firmware" value={health?.firmware_version} icon={<SystemUpdateAltIcon />} color={theme.palette.info.main} />
              <InfoRow label="Hardware" value={health?.hardware_version} icon={<MemoryIcon />} />
              <InfoRow label="IP Address" value={health?.ip_address} icon={<RouterIcon />} />
            </Stack>
          )}
        </Box>

        <Divider />

        {/* Event Timeline */}
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
            กิจกรรมล่าสุด
          </Typography>
          {loading ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {[...Array(4)].map((_, i) => <Skeleton key={i} height={44} />)}
            </Stack>
          ) : health?.recent_logs?.length > 0 ? (
            <Stack
              divider={<Divider sx={{ ml: 5 }} />}
              sx={{ mt: 1 }}
            >
              {health.recent_logs.map((log) => (
                <EventItem key={log._id} event={log} />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, textAlign: "center", py: 2 }}>
              ยังไม่มีกิจกรรม
            </Typography>
          )}
        </Box>
      </Box>
    </Drawer>
  );
}
