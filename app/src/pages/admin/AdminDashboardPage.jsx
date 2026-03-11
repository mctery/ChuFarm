import { useState, useEffect, useMemo } from "react";
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
  useTheme,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import DevicesIcon from "@mui/icons-material/DevicesOther";
import SensorsIcon from "@mui/icons-material/Sensors";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import StatCard from "../../components/admin/StatCard";
import apiClient from "../../services/apiClient";
import { formatDate } from "../../utils/dateFormat";

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

export default function AdminDashboardPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Chart data derived from stats
  const devicePieData = useMemo(() => {
    if (!stats) return [];
    const online = stats.onlineDevices ?? 0;
    const offline = (stats.devices ?? 0) - online;
    return [
      { id: 0, value: online, label: "ออนไลน์", color: theme.palette.success.main },
      { id: 1, value: Math.max(0, offline), label: "ออฟไลน์", color: theme.palette.grey[400] },
    ];
  }, [stats, theme]);

  const severityBarData = useMemo(() => {
    if (!stats?.recentNotifications) return { labels: [], values: [] };
    const counts = { info: 0, warning: 0, critical: 0 };
    stats.recentNotifications.forEach((n) => { if (n.severity in counts) counts[n.severity]++; });
    return { labels: ["info", "warning", "critical"], values: [counts.info, counts.warning, counts.critical] };
  }, [stats]);

  const auditPieData = useMemo(() => {
    if (!stats?.recentAuditLogs) return [];
    const counts = {};
    stats.recentAuditLogs.forEach((l) => { counts[l.action] = (counts[l.action] || 0) + 1; });
    const colors = [
      theme.palette.success.main, theme.palette.info.main, theme.palette.error.main,
      theme.palette.primary.main, theme.palette.warning.main, theme.palette.grey[500],
    ];
    return Object.entries(counts).map(([action, value], idx) => ({
      id: idx, value, label: action, color: colors[idx % colors.length],
    }));
  }, [stats, theme]);

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

      {/* Charts Row */}
      {!loading && stats && (
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
          {/* Device Online/Offline Pie */}
          <Paper variant="outlined" sx={{ flex: 1, p: 2, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>สถานะอุปกรณ์</Typography>
            {devicePieData.some((d) => d.value > 0) ? (
              <PieChart
                series={[{ data: devicePieData, innerRadius: 40, outerRadius: 70, paddingAngle: 2, cornerRadius: 3 }]}
                height={160}
                slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 } }}
              />
            ) : (
              <Box sx={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled">ไม่มีข้อมูลอุปกรณ์</Typography>
              </Box>
            )}
          </Paper>

          {/* Notifications by Severity Bar */}
          <Paper variant="outlined" sx={{ flex: 1, p: 2, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>แจ้งเตือนแยกตามระดับ</Typography>
            {severityBarData.values.some((v) => v > 0) ? (
              <BarChart
                xAxis={[{ scaleType: "band", data: severityBarData.labels }]}
                series={[{
                  data: severityBarData.values,
                  color: theme.palette.primary.main,
                }]}
                height={160}
                margin={{ top: 10, bottom: 30, left: 30, right: 10 }}
                sx={{ "& .MuiChartsAxis-tickLabel": { fontSize: "0.7rem" } }}
              />
            ) : (
              <Box sx={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled">ไม่มีข้อมูลแจ้งเตือน</Typography>
              </Box>
            )}
          </Paper>

          {/* Audit Action Breakdown Pie */}
          <Paper variant="outlined" sx={{ flex: 1, p: 2, minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={600} mb={1}>กิจกรรมแยกตามประเภท</Typography>
            {auditPieData.length > 0 ? (
              <PieChart
                series={[{ data: auditPieData, innerRadius: 40, outerRadius: 70, paddingAngle: 2, cornerRadius: 3 }]}
                height={160}
                slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" }, padding: 0 } }}
              />
            ) : (
              <Box sx={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="caption" color="text.disabled">ไม่มีข้อมูลกิจกรรม</Typography>
              </Box>
            )}
          </Paper>
        </Stack>
      )}

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
