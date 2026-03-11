import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Card,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";
import "dayjs/locale/th";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import BarChartIcon from "@mui/icons-material/BarChart";
import StorageIcon from "@mui/icons-material/Storage";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import { LineChart } from "@mui/x-charts/LineChart";

import SkeletonCardGrid from "../../components/SkeletonCardGrid";
import PageBreadcrumbs from "../../components/PageBreadcrumbs";
import ExportDialog from "../../components/ExportDialog";
import {
  SysGetDeviceSensorsById,
  SysGetSensorDataAggregate,
} from "../../services/sensor_service";
import { SysGetDeviceById } from "../../services/device_service";
import { SENSORS_TYPE } from "../../services/global_variable";
import { ROUTES } from "../../constants/routes";

const TIME_RANGES = [
  { label: "1 ชม.", value: 1, unit: "hour" },
  { label: "6 ชม.", value: 6, unit: "hour" },
  { label: "24 ชม.", value: 24, unit: "hour" },
  { label: "7 วัน", value: 7, unit: "day" },
  { label: "30 วัน", value: 30, unit: "day" },
];

const SENSOR_COLORS = {
  temperature: { main: "#ef5350", light: "#ffcdd2", gradient: "linear-gradient(135deg, #ef5350 0%, #e57373 100%)" },
  humidity: { main: "#42a5f5", light: "#bbdefb", gradient: "linear-gradient(135deg, #42a5f5 0%, #64b5f6 100%)" },
  light: { main: "#ffa726", light: "#ffe0b2", gradient: "linear-gradient(135deg, #ffa726 0%, #ffb74d 100%)" },
  soil: { main: "#66bb6a", light: "#c8e6c9", gradient: "linear-gradient(135deg, #66bb6a 0%, #81c784 100%)" },
};

const DEFAULT_COLOR = { main: "#78909c", light: "#cfd8dc", gradient: "linear-gradient(135deg, #78909c 0%, #90a4ae 100%)" };

export default function SensorHistoryPage() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [sensors, setSensors] = useState([]);
  const [selectedSensor, setSelectedSensor] = useState("");
  const [timeRange, setTimeRange] = useState(24);
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [chartData, setChartData] = useState([]);
  const [summary, setSummary] = useState({ avg: 0, min: 0, max: 0, count: 0 });
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      const [sensorList, device] = await Promise.all([
        SysGetDeviceSensorsById(deviceId),
        SysGetDeviceById(deviceId),
      ]);
      if (device) setDeviceName(device.name);
      if (Array.isArray(sensorList) && sensorList.length > 0) {
        setSensors(sensorList);
        setSelectedSensor(`${sensorList[0].sensor_type}|${sensorList[0].sensor_id}`);
      }
      setLoading(false);
    };
    init();
  }, [deviceId]);

  const sensorRef = useRef(selectedSensor);
  const rangeRef = useRef(timeRange);
  sensorRef.current = selectedSensor;
  rangeRef.current = timeRange;

  const doFetch = useCallback(async (sensor, range, custom) => {
    if (!sensor) return;
    setChartLoading(true);
    const [sType, sId] = sensor.split("|");

    let startISO, endISO, groupBy;
    if (range === "custom" && custom?.start && custom?.end) {
      startISO = custom.start.toISOString();
      endISO = custom.end.toISOString();
      const diffDays = custom.end.diff(custom.start, "day");
      groupBy = diffDays >= 2 ? "day" : "hour";
    } else {
      const rangeConfig = TIME_RANGES.find((t) => t.value === range);
      const now = new Date();
      const startDate = new Date(now);
      if (rangeConfig.unit === "hour") {
        startDate.setHours(startDate.getHours() - rangeConfig.value);
      } else {
        startDate.setDate(startDate.getDate() - rangeConfig.value);
      }
      startISO = startDate.toISOString();
      endISO = now.toISOString();
      groupBy = range >= 7 ? "day" : "hour";
    }

    const result = await SysGetSensorDataAggregate(
      deviceId, sType, sId,
      startISO, endISO, groupBy
    );
    if (Array.isArray(result) && result.length > 0) {
      setChartData(result);
      let sumAvg = 0, minVal = Infinity, maxVal = -Infinity, totalCount = 0;
      for (const d of result) {
        sumAvg += d.avg;
        if (d.min < minVal) minVal = d.min;
        if (d.max > maxVal) maxVal = d.max;
        totalCount += d.count;
      }
      setSummary({
        avg: (sumAvg / result.length).toFixed(1),
        min: minVal.toFixed(1),
        max: maxVal.toFixed(1),
        count: totalCount,
      });
    } else {
      setChartData([]);
      setSummary({ avg: 0, min: 0, max: 0, count: 0 });
    }
    setChartLoading(false);
  }, [deviceId]);

  useEffect(() => {
    if (selectedSensor && timeRange !== "custom") doFetch(selectedSensor, timeRange);
  }, [selectedSensor, timeRange, doFetch]);

  const handleRefresh = useCallback(() => {
    doFetch(sensorRef.current, rangeRef.current, rangeRef.current === "custom" ? customRange : undefined);
  }, [doFetch, customRange]);

  const handleExportCSV = useCallback(() => {
    if (chartData.length === 0) return;
    const [sType, sId] = sensorRef.current.split("|");
    const sensorObj = sensors.find(
      (s) => s.sensor_type === sType && s.sensor_id === sId
    );
    const sName = sensorObj?.sensor_name || sType;
    const sUnit = SENSORS_TYPE[sType]?.unit || "";

    const header = ["เวลา", `ค่าเฉลี่ย (${sUnit})`, `ค่าต่ำสุด (${sUnit})`, `ค่าสูงสุด (${sUnit})`, "จำนวนข้อมูล"];
    const rows = chartData.map((d) => [
      new Date(d.time).toLocaleString("th-TH"),
      d.avg,
      d.min,
      d.max,
      d.count,
    ]);

    const BOM = "\uFEFF";
    const csv = BOM + [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deviceName}_${sName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chartData, sensors, deviceName]);

  const [sensorType] = useMemo(
    () => (selectedSensor ? selectedSensor.split("|") : [""]),
    [selectedSensor]
  );
  const sensorInfo = SENSORS_TYPE[sensorType];
  const unit = sensorInfo?.unit || "";
  const colors = SENSOR_COLORS[sensorType] || DEFAULT_COLOR;
  const isDark = theme.palette.mode === "dark";

  if (loading) return <SkeletonCardGrid count={4} height={200} />;

  const selectedSensorObj = sensors.find(
    (s) => `${s.sensor_type}|${s.sensor_id}` === selectedSensor
  );

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <PageBreadcrumbs crumbs={[{ label: "อุปกรณ์", path: ROUTES.DEVICES }, { label: deviceName || deviceId }]} />
      {/* ── Header ── */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <IconButton
          onClick={() => navigate(ROUTES.DEVICES)}
          size="small"
          sx={{
            bgcolor: alpha(colors.main, 0.1),
            color: colors.main,
            "&:hover": { bgcolor: alpha(colors.main, 0.2) },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700} lineHeight={1.3}>
            {deviceName || "อุปกรณ์"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {deviceId}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="ส่งออกข้อมูล">
            <IconButton
              onClick={() => setExportOpen(true)}
              size="small"
              sx={{
                bgcolor: alpha(colors.main, 0.1),
                color: colors.main,
                "&:hover": { bgcolor: alpha(colors.main, 0.2) },
              }}
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="รีเฟรชข้อมูล">
            <span>
              <IconButton
                onClick={handleRefresh}
                disabled={chartLoading}
                size="small"
                sx={{
                  bgcolor: alpha(colors.main, 0.1),
                  color: colors.main,
                  "&:hover": { bgcolor: alpha(colors.main, 0.2) },
                }}
              >
                <RefreshIcon
                  fontSize="small"
                  sx={{
                    animation: chartLoading ? "spin 1s linear infinite" : "none",
                    "@keyframes spin": {
                      "0%": { transform: "rotate(0deg)" },
                      "100%": { transform: "rotate(360deg)" },
                    },
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {/* ── Sensor Tabs ── */}
      <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: "auto", pb: 0.5 }}>
        {sensors.map((s) => {
          const info = SENSORS_TYPE[s.sensor_type];
          const sc = SENSOR_COLORS[s.sensor_type] || DEFAULT_COLOR;
          const key = `${s.sensor_type}|${s.sensor_id}`;
          const isActive = selectedSensor === key;
          return (
            <ButtonBase
              key={s._id}
              onClick={() => setSelectedSensor(key)}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 2.5,
                flexShrink: 0,
                transition: "all 0.2s ease",
                border: "1.5px solid",
                borderColor: isActive ? sc.main : "transparent",
                bgcolor: isActive
                  ? alpha(sc.main, isDark ? 0.15 : 0.08)
                  : alpha(theme.palette.action.hover, 0.5),
                "&:hover": {
                  bgcolor: alpha(sc.main, isDark ? 0.2 : 0.12),
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: isActive ? sc.main : alpha(sc.main, 0.2),
                    color: isActive ? "#fff" : sc.main,
                    transition: "all 0.2s ease",
                    "& .MuiSvgIcon-root": { fontSize: 16 },
                  }}
                >
                  {info?.icon}
                </Avatar>
                <Box sx={{ textAlign: "left" }}>
                  <Typography
                    variant="body2"
                    fontWeight={isActive ? 700 : 500}
                    color={isActive ? sc.main : "text.primary"}
                    lineHeight={1.2}
                  >
                    {s.sensor_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" lineHeight={1}>
                    {info?.name}
                  </Typography>
                </Box>
              </Stack>
            </ButtonBase>
          );
        })}
      </Stack>

      {/* ── Time Range Pills ── */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: timeRange === "custom" ? 1.5 : 2.5 }}>
        <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
          {TIME_RANGES.map((r) => {
            const isActive = timeRange === r.value;
            return (
              <ButtonBase
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 5,
                  fontSize: "0.8rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#fff" : "text.secondary",
                  bgcolor: isActive ? colors.main : "transparent",
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: isActive ? colors.main : alpha(colors.main, 0.1) },
                }}
              >
                {r.label}
              </ButtonBase>
            );
          })}
          {/* Custom range pill */}
          <ButtonBase
            onClick={() => setTimeRange("custom")}
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 5,
              fontSize: "0.8rem",
              fontWeight: timeRange === "custom" ? 700 : 500,
              color: timeRange === "custom" ? "#fff" : "text.secondary",
              bgcolor: timeRange === "custom" ? colors.main : "transparent",
              transition: "all 0.2s ease",
              "&:hover": { bgcolor: timeRange === "custom" ? colors.main : alpha(colors.main, 0.1) },
            }}
          >
            กำหนดเอง
          </ButtonBase>
        </Stack>
      </Stack>

      {/* Custom date range inputs */}
      {timeRange === "custom" && (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2.5 }}>
            <DateTimePicker
              label="เริ่มต้น"
              value={customRange.start}
              onChange={(v) => setCustomRange((prev) => ({ ...prev, start: v }))}
              maxDateTime={customRange.end ?? dayjs()}
              slotProps={{ textField: { size: "small", sx: { minWidth: 200 } } }}
            />
            <DateTimePicker
              label="สิ้นสุด"
              value={customRange.end}
              onChange={(v) => setCustomRange((prev) => ({ ...prev, end: v }))}
              minDateTime={customRange.start}
              maxDateTime={dayjs()}
              slotProps={{ textField: { size: "small", sx: { minWidth: 200 } } }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={!customRange.start || !customRange.end || chartLoading}
              onClick={() => doFetch(selectedSensor, "custom", customRange)}
              sx={{ height: 40, px: 3 }}
            >
              ดูข้อมูล
            </Button>
          </Stack>
        </LocalizationProvider>
      )}

      {/* ── Summary Cards ── */}
      <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="ค่าเฉลี่ย"
            value={summary.avg}
            unit={unit}
            icon={<TrendingFlatIcon />}
            color={colors.main}
            loading={chartLoading}
            isDark={isDark}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="ค่าต่ำสุด"
            value={summary.min}
            unit={unit}
            icon={<TrendingDownIcon />}
            color={theme.palette.success.main}
            loading={chartLoading}
            isDark={isDark}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="ค่าสูงสุด"
            value={summary.max}
            unit={unit}
            icon={<TrendingUpIcon />}
            color={theme.palette.error.main}
            loading={chartLoading}
            isDark={isDark}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard
            label="จำนวนข้อมูล"
            value={summary.count}
            unit="รายการ"
            icon={<StorageIcon />}
            color={theme.palette.warning.main}
            loading={chartLoading}
            isDark={isDark}
          />
        </Grid>
      </Grid>

      {/* ── Chart ── */}
      <Card
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 3,
        }}
      >
        {/* Top accent bar */}
        <Box
          sx={{
            height: 3,
            background: colors.gradient,
          }}
        />

        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          {/* Chart header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(colors.main, 0.12),
                  color: colors.main,
                  "& .MuiSvgIcon-root": { fontSize: 18 },
                }}
              >
                {sensorInfo?.icon}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                  {selectedSensorObj?.sensor_name || sensorInfo?.name || "เซ็นเซอร์"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {sensorInfo?.name}{unit ? ` (${unit})` : ""}
                </Typography>
              </Box>
            </Stack>
            {chartLoading && <CircularProgress size={18} sx={{ color: colors.main }} />}
          </Stack>

          <Divider sx={{ mb: 1 }} />

          {/* Chart body */}
          {chartLoading && chartData.length === 0 ? (
            <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
          ) : chartData.length > 0 ? (
            <Box sx={{ width: "100%", overflowX: "auto", mx: -1 }}>
              <LineChart
                height={320}
                margin={{ left: 48, right: 16, top: 20, bottom: 30 }}
                xAxis={[{
                  data: chartData.map((d) => new Date(d.time)),
                  scaleType: "time",
                }]}
                yAxis={[{
                  label: unit,
                }]}
                series={[
                  {
                    data: chartData.map((d) => d.avg),
                    label: "ค่าเฉลี่ย",
                    color: colors.main,
                    curve: "catmullRom",
                    area: true,
                    showMark: chartData.length <= 30,
                  },
                  {
                    data: chartData.map((d) => d.min),
                    label: "ต่ำสุด",
                    color: theme.palette.success.main,
                    curve: "catmullRom",
                    showMark: false,
                  },
                  {
                    data: chartData.map((d) => d.max),
                    label: "สูงสุด",
                    color: theme.palette.error.main,
                    curve: "catmullRom",
                    showMark: false,
                  },
                ]}
                slotProps={{
                  legend: {
                    position: { vertical: "top", horizontal: "right" },
                  },
                }}
                grid={{ horizontal: true }}
                sx={{
                  "& .MuiAreaElement-root": { fillOpacity: 0.06 },
                  "& .MuiChartsAxis-tickLabel": { fontSize: 11 },
                  "& .MuiChartsAxisHighlight-root": { stroke: alpha(colors.main, 0.3) },
                }}
              />
            </Box>
          ) : (
            <Stack alignItems="center" justifyContent="center" sx={{ height: 280, py: 4 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: alpha(colors.main, 0.08),
                  color: colors.main,
                  mb: 2,
                }}
              >
                <ShowChartIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography color="text.secondary" fontWeight={600} variant="body1" gutterBottom>
                ยังไม่มีข้อมูล
              </Typography>
              <Typography color="text.secondary" variant="body2" textAlign="center" sx={{ maxWidth: 280 }}>
                ข้อมูลจะแสดงเมื่ออุปกรณ์ส่งค่าเซ็นเซอร์เข้ามา
              </Typography>
            </Stack>
          )}
        </Box>
      </Card>

      <ExportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        deviceId={deviceId}
        deviceName={deviceName}
      />
    </Box>
  );
}

function StatCard({ icon, label, value, unit, color, loading, isDark }) {
  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: 2.5,
        border: "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
          <Avatar
            sx={{
              width: 26,
              height: 26,
              bgcolor: alpha(color, isDark ? 0.2 : 0.1),
              color,
              "& .MuiSvgIcon-root": { fontSize: 15 },
            }}
          >
            {icon}
          </Avatar>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {label}
          </Typography>
        </Stack>
        {loading ? (
          <Skeleton width="70%" height={32} />
        ) : (
          <Stack direction="row" alignItems="baseline" spacing={0.5}>
            <Typography variant="h5" fontWeight={800} sx={{ color, lineHeight: 1 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {unit}
            </Typography>
          </Stack>
        )}
      </Box>
    </Card>
  );
}
