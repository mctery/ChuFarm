import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Stack,
  Box,
  Tooltip,
  Avatar,
  alpha,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import TimelineIcon from "@mui/icons-material/Timeline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SettingsIcon from "@mui/icons-material/Settings";
import CircleIcon from "@mui/icons-material/Circle";
import DevicesIcon from "@mui/icons-material/Devices";
import TerminalIcon from "@mui/icons-material/Terminal";

import DeviceCommandDialog from "./DeviceCommandDialog";

import { SocketSubscribe } from "../services/socket_service";
import { SIGNAL_ICON, RSSI_THRESHOLD } from "../services/global_variable";

export default function DeviceWidget({ device, onEdit, onDelete }) {
  const [realtime, setRealtime] = useState(null);
  const [signal, setSignal] = useState(SIGNAL_ICON.OFFLINE);
  const [cmdOpen, setCmdOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    let subscribeCheckin = null;
    let subscribeWill = null;

    async function fetchSocket() {
      try {
        subscribeCheckin = await SocketSubscribe(
          `device/${device.device_id}/checkin`,
          (payload) => setRealtime(payload)
        );
        subscribeWill = await SocketSubscribe(
          `device/${device.device_id}/will`,
          () => setRealtime(null)
        );
      } catch (err) {
        console.warn("SocketSubscribe Error:", err);
      }
    }

    fetchSocket();
    return () => {
      subscribeCheckin?.();
      subscribeWill?.();
    };
  }, [device.device_id]);

  useEffect(() => {
    const rssi = realtime?.addr?.rssi;
    if (typeof rssi !== "number") setSignal(SIGNAL_ICON.OFFLINE);
    else if (rssi >= RSSI_THRESHOLD.GOOD) setSignal(SIGNAL_ICON.GOOD);
    else if (rssi >= RSSI_THRESHOLD.MEDIUM) setSignal(SIGNAL_ICON.MEDIUM);
    else if (rssi >= RSSI_THRESHOLD.BAD) setSignal(SIGNAL_ICON.BAD);
    else setSignal(SIGNAL_ICON.OFFLINE);
  }, [realtime?.addr?.rssi]);

  const isOnline = !!realtime;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Avatar
          src={device.image || undefined}
          sx={{
            width: 40,
            height: 40,
            bgcolor: isOnline
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.grey[500], 0.1),
            color: isOnline ? "primary.main" : "text.disabled",
          }}
        >
          {!device.image && <DevicesIcon fontSize="small" />}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} noWrap>
            {device.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {device.device_id}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.25} alignItems="center">
          {signal}
          <Chip
            icon={
              <CircleIcon
                sx={{
                  fontSize: "8px !important",
                  color: isOnline ? "success.main" : "text.disabled",
                }}
              />
            }
            label={isOnline ? "ON" : "OFF"}
            size="small"
            variant="outlined"
            color={isOnline ? "success" : "default"}
            sx={{ height: 24, fontSize: "0.7rem" }}
          />
        </Stack>
      </Box>

      {/* Actions */}
      <CardContent sx={{ p: 1.5, pt: 1, pb: "8px !important", mt: "auto" }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="แดชบอร์ด">
              <IconButton
                size="small"
                color="primary"
                onClick={() => navigate(`gridstack/${device.device_id}`)}
              >
                <DashboardIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="ประวัติข้อมูล">
              <IconButton
                size="small"
                color="info"
                onClick={() => navigate(`history/${device.device_id}`)}
              >
                <TimelineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="ตั้งค่า">
              <IconButton
                size="small"
                onClick={() => onEdit(device)}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={isOnline ? "ส่งคำสั่ง" : "อุปกรณ์ออฟไลน์"}>
              <span>
                <IconButton
                  size="small"
                  color="secondary"
                  disabled={!isOnline}
                  onClick={() => setCmdOpen(true)}
                >
                  <TerminalIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Tooltip title="ลบอุปกรณ์">
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(device)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardContent>

      <DeviceCommandDialog
        open={cmdOpen}
        device={device}
        onClose={() => setCmdOpen(false)}
      />
    </Card>
  );
}
