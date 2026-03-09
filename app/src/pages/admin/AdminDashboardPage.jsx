import { useState, useEffect } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import DevicesIcon from "@mui/icons-material/DevicesOther";
import SensorsIcon from "@mui/icons-material/Sensors";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import StatCard from "../../components/admin/StatCard";
import apiClient from "../../services/apiClient";

const ACTION_COLORS = {
  create: "success",
  update: "info",
  delete: "error",
  login: "primary",
  logout: "default",
};

const SEVERITY_COLORS = {
  info: "info",
  warning: "warning",
  critical: "error",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AdminDashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiClient.get("/api/admin/stats");
        setStats(data.data);
      } catch {
        enqueueSnackbar("โหลดข้อมูลภาพรวมไม่สำเร็จ", { variant: "error" });
      } finally {
        setLoading(false);
      }
    })();
  }, [enqueueSnackbar]);

  return (
    <AdminPageWrapper title="ภาพรวมระบบ">
      {/* Stat Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: "wrap" }}>
        <StatCard
          icon={<PeopleIcon />}
          label="ผู้ใช้ทั้งหมด"
          value={stats?.users ?? 0}
          color="success.main"
          loading={loading}
        />
        <StatCard
          icon={<DevicesIcon />}
          label="อุปกรณ์"
          value={`${stats?.onlineDevices ?? 0} / ${stats?.devices ?? 0}`}
          color="info.main"
          loading={loading}
        />
        <StatCard
          icon={<SensorsIcon />}
          label="เซ็นเซอร์"
          value={stats?.sensors ?? 0}
          color="warning.main"
          loading={loading}
        />
        <StatCard
          icon={<NotificationsIcon />}
          label="แจ้งเตือน"
          value={stats?.notifications ?? 0}
          color="error.main"
          loading={loading}
        />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Recent Audit Logs */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            กิจกรรมล่าสุด
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>วันที่</TableCell>
                  <TableCell>การกระทำ</TableCell>
                  <TableCell>ประเภท</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(stats?.recentAuditLogs || []).map((log) => (
                  <TableRow key={log._id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={log.action}
                        color={ACTION_COLORS[log.action] || "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{log.resource_type}</TableCell>
                  </TableRow>
                ))}
                {!loading && (!stats?.recentAuditLogs || stats.recentAuditLogs.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        ไม่มีข้อมูล
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Recent Notifications */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            แจ้งเตือนล่าสุด
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>วันที่</TableCell>
                  <TableCell>หัวข้อ</TableCell>
                  <TableCell>ระดับ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(stats?.recentNotifications || []).map((n) => (
                  <TableRow key={n._id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(n.createdAt)}
                    </TableCell>
                    <TableCell>{n.title}</TableCell>
                    <TableCell>
                      <Chip
                        label={n.severity}
                        color={SEVERITY_COLORS[n.severity] || "default"}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && (!stats?.recentNotifications || stats.recentNotifications.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography color="text.secondary" sx={{ py: 2 }}>
                        ไม่มีข้อมูล
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </AdminPageWrapper>
  );
}
