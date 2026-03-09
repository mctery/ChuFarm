import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Box,
  Skeleton,
  Divider,
} from "@mui/material";
import StorageIcon from "@mui/icons-material/Storage";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import apiClient from "../../services/apiClient";

function InfoRow({ label, value, chip }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      {chip ? (
        <Chip label={value} color={chip} size="small" />
      ) : (
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      )}
    </Stack>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d} วัน ${h} ชม.`;
  if (h > 0) return `${h} ชม. ${m} นาที`;
  return `${m} นาที`;
}

function formatBytes(bytes) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export default function AdminSettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get("/api/admin/system-info");
        setInfo(data.data);
      } catch {
        enqueueSnackbar("โหลดข้อมูลระบบไม่สำเร็จ", { variant: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [enqueueSnackbar]);

  if (loading) {
    return (
      <AdminPageWrapper title="ตั้งค่าระบบ">
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={200} />
          ))}
        </Stack>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="ตั้งค่าระบบ">
      <Stack spacing={3}>
        {/* System Status */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <StorageIcon color="primary" />
              <Typography variant="h6">สถานะระบบ</Typography>
            </Stack>
            <InfoRow
              label="Database"
              value={info?.database?.status === "connected" ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
              chip={info?.database?.status === "connected" ? "success" : "error"}
            />
            <InfoRow
              label="Database Name"
              value={info?.database?.name || "—"}
            />
            <Divider sx={{ my: 1 }} />
            <InfoRow
              label="MQTT"
              value={info?.mqtt?.configured ? "กำหนดค่าแล้ว" : "ยังไม่ได้กำหนดค่า"}
              chip={info?.mqtt?.configured ? "success" : "warning"}
            />
            <InfoRow
              label="Email (Resend)"
              value={info?.email?.configured ? "กำหนดค่าแล้ว" : "ยังไม่ได้กำหนดค่า"}
              chip={info?.email?.configured ? "success" : "warning"}
            />
            <Divider sx={{ my: 1 }} />
            <InfoRow label="Uptime" value={formatUptime(info?.server?.uptime || 0)} />
            <InfoRow
              label="Memory (RSS)"
              value={formatBytes(info?.server?.memoryUsage?.rss)}
            />
            <InfoRow
              label="Memory (Heap Used)"
              value={formatBytes(info?.server?.memoryUsage?.heapUsed)}
            />
            <InfoRow label="Node.js" value={info?.server?.nodeVersion || "—"} />
          </CardContent>
        </Card>

        {/* Default Settings */}
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SettingsIcon color="primary" />
              <Typography variant="h6">ค่าเริ่มต้นระบบ</Typography>
            </Stack>
            <InfoRow label="Environment" value={info?.server?.nodeEnv || "—"} />
            <InfoRow label="JWT Expiry" value={info?.defaults?.jwtExpiry || "—"} />
            <InfoRow label="Refresh Token Expiry" value={info?.defaults?.refreshExpiry || "—"} />
            <Divider sx={{ my: 1 }} />
            <InfoRow
              label="Sensor Data TTL"
              value={`${(info?.defaults?.sensorDataTTL || 0) / 86400} วัน`}
            />
            <InfoRow
              label="Rate Limit"
              value={`${info?.defaults?.rateLimitMax || 0} req / ${((info?.defaults?.rateLimitWindowMs || 0) / 60000).toFixed(0)} นาที`}
            />
            <InfoRow
              label="Auth Rate Limit"
              value={`${info?.defaults?.authRateLimitMax || 0} req / ${((info?.defaults?.rateLimitWindowMs || 0) / 60000).toFixed(0)} นาที`}
            />
          </CardContent>
        </Card>
      </Stack>
    </AdminPageWrapper>
  );
}
