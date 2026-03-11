import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Stack,
  Chip,
  Alert,
  Skeleton,
  Paper,
  CircularProgress,
  useTheme,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import { LineChart } from "@mui/x-charts/LineChart";
import { BarChart } from "@mui/x-charts/BarChart";
import { useSnackbar } from "notistack";

import { SysGetDevices } from "../../services/device_service";
import {
  SysGetAnalyticsSummary,
  SysGetAnalyticsTrend,
  SysGetAnalyticsCompare,
  SysGetAnalyticsRecommendations,
} from "../../services/analytics_service";

const PERIODS = [
  { value: "daily", label: "รายวัน" },
  { value: "weekly", label: "รายสัปดาห์" },
  { value: "monthly", label: "รายเดือน" },
];

const SENSOR_COLORS = {
  temperature: "#ef5350",
  humidity: "#42a5f5",
  light: "#ffa726",
  soil: "#66bb6a",
};

const TREND_ICON = {
  rising: <TrendingUpIcon color="error" />,
  falling: <TrendingDownIcon color="success" />,
  stable: <TrendingFlatIcon color="disabled" />,
};

const TREND_LABEL = {
  rising: "เพิ่มขึ้น",
  falling: "ลดลง",
  stable: "คงที่",
};

function TabPanel({ value, index, children }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────

function SummaryTab({ deviceId }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    const res = await SysGetAnalyticsSummary(deviceId, { period });
    setLoading(false);
    if (res) {
      setData(res);
    } else {
      enqueueSnackbar("โหลดข้อมูล Summary ไม่สำเร็จ", { variant: "error" });
    }
  }, [deviceId, period, enqueueSnackbar]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Flatten summaries → chart data per sensor_type
  const chartsBySensor = {};
  if (data?.summaries) {
    data.summaries.forEach((entry) => {
      entry.sensors?.forEach((s) => {
        if (!chartsBySensor[s.sensor_type]) chartsBySensor[s.sensor_type] = [];
        chartsBySensor[s.sensor_type].push({ period: entry.period, avg: s.avg, min: s.min, max: s.max });
      });
    });
  }

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>ช่วงเวลา</InputLabel>
          <Select value={period} label="ช่วงเวลา" onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Grid container spacing={2}>
          {[1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : Object.keys(chartsBySensor).length === 0 ? (
        <Alert severity="info">ไม่มีข้อมูลสำหรับอุปกรณ์นี้</Alert>
      ) : (
        <Grid container spacing={2}>
          {Object.entries(chartsBySensor).map(([sensorType, points]) => (
            <Grid key={sensorType} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ textTransform: "capitalize" }}>
                    {sensorType}
                  </Typography>
                  <LineChart
                    height={220}
                    margin={{ left: 48, right: 16, top: 16, bottom: 30 }}
                    xAxis={[{ data: points.map((p) => p.period), scaleType: "band" }]}
                    series={[
                      { data: points.map((p) => p.avg), label: "เฉลี่ย", color: SENSOR_COLORS[sensorType] || theme.palette.primary.main, curve: "catmullRom" },
                      { data: points.map((p) => p.min), label: "ต่ำสุด", color: theme.palette.success.main, curve: "catmullRom" },
                      { data: points.map((p) => p.max), label: "สูงสุด", color: theme.palette.error.main, curve: "catmullRom" },
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// ─── Trend Tab ────────────────────────────────────────────────────────────────

function TrendTab({ deviceId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    SysGetAnalyticsTrend(deviceId).then((res) => {
      setLoading(false);
      if (res) setData(res);
      else enqueueSnackbar("โหลดข้อมูล Trend ไม่สำเร็จ", { variant: "error" });
    });
  }, [deviceId, enqueueSnackbar]);

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />;
  if (!data?.trends?.length) return <Alert severity="info">ไม่มีข้อมูล Trend สำหรับอุปกรณ์นี้</Alert>;

  return (
    <Grid container spacing={2}>
      {data.trends.map((t) => (
        <Grid key={t.sensor_id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                    {t.sensor_type}
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {t.current_avg?.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ก่อนหน้า: {t.previous_avg?.toFixed(2)}
                  </Typography>
                </Box>
                <Stack alignItems="center" spacing={0.5}>
                  {TREND_ICON[t.trend] || <TrendingFlatIcon />}
                  <Chip
                    label={TREND_LABEL[t.trend] || t.trend}
                    size="small"
                    color={t.trend === "rising" ? "error" : t.trend === "falling" ? "success" : "default"}
                    variant="outlined"
                  />
                  {t.change_percent != null && (
                    <Typography variant="caption" color="text.secondary">
                      {t.change_percent > 0 ? "+" : ""}{t.change_percent?.toFixed(1)}%
                    </Typography>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// ─── Compare Tab ──────────────────────────────────────────────────────────────

function CompareTab({ devices, deviceId }) {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [deviceId2, setDeviceId2] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchCompare(d2) {
    if (!deviceId || !d2) return;
    setLoading(true);
    const res = await SysGetAnalyticsCompare(deviceId, d2);
    setLoading(false);
    if (res) setData(res);
    else enqueueSnackbar("โหลดข้อมูลเปรียบเทียบไม่สำเร็จ", { variant: "error" });
  }

  function handleSelectDevice2(val) {
    setDeviceId2(val);
    fetchCompare(val);
  }

  const dev1 = devices.find((d) => d.device_id === deviceId);
  const dev2 = devices.find((d) => d.device_id === deviceId2);

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>เปรียบเทียบกับอุปกรณ์</InputLabel>
          <Select
            value={deviceId2}
            label="เปรียบเทียบกับอุปกรณ์"
            onChange={(e) => handleSelectDevice2(e.target.value)}
          >
            {devices
              .filter((d) => d.device_id !== deviceId)
              .map((d) => (
                <MenuItem key={d.device_id} value={d.device_id}>{d.name}</MenuItem>
              ))}
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 2 }} />
      ) : !data?.comparison?.length ? (
        <Alert severity="info">เลือกอุปกรณ์ที่ 2 เพื่อเปรียบเทียบ</Alert>
      ) : (
        <Grid container spacing={2}>
          {data.comparison.map((c) => (
            <Grid key={c.sensor_type} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700} mb={1} sx={{ textTransform: "capitalize" }}>
                    {c.sensor_type}
                  </Typography>
                  <BarChart
                    height={220}
                    margin={{ left: 48, right: 16, top: 16, bottom: 40 }}
                    xAxis={[{ data: ["ต่ำสุด", "เฉลี่ย", "สูงสุด"], scaleType: "band" }]}
                    series={[
                      {
                        data: [c.device_id_1?.min, c.device_id_1?.avg, c.device_id_1?.max],
                        label: dev1?.name || deviceId,
                        color: theme.palette.primary.main,
                      },
                      {
                        data: [c.device_id_2?.min, c.device_id_2?.avg, c.device_id_2?.max],
                        label: dev2?.name || deviceId2,
                        color: theme.palette.secondary.main,
                      },
                    ]}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// ─── Recommendations Tab ─────────────────────────────────────────────────────

function RecommendationsTab({ deviceId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!deviceId) return;
    setLoading(true);
    SysGetAnalyticsRecommendations(deviceId).then((res) => {
      setLoading(false);
      if (res) setData(res);
      else enqueueSnackbar("โหลดคำแนะนำไม่สำเร็จ", { variant: "error" });
    });
  }, [deviceId, enqueueSnackbar]);

  if (loading) return <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />;
  if (!data?.recommendations?.length) return <Alert severity="info">ไม่มีคำแนะนำสำหรับอุปกรณ์นี้</Alert>;

  return (
    <Stack spacing={1.5}>
      {data.recommendations.map((rec, i) => (
        <Paper key={i} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Chip
              label={rec.sensor_type || rec.type || "ทั่วไป"}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ textTransform: "capitalize", mt: 0.25 }}
            />
            <Box>
              {rec.message && (
                <Typography variant="body2">{rec.message}</Typography>
              )}
              {rec.suggestion && (
                <Typography variant="body2" color="text.secondary">{rec.suggestion}</Typography>
              )}
              {typeof rec === "string" && (
                <Typography variant="body2">{rec}</Typography>
              )}
            </Box>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    SysGetDevices().then((data) => {
      setDevices(data);
      if (data.length > 0) setDeviceId(data[0].device_id);
      setLoading(false);
    }).catch(() => {
      enqueueSnackbar("โหลดข้อมูลอุปกรณ์ไม่สำเร็จ", { variant: "error" });
      setLoading(false);
    });
  }, [enqueueSnackbar]);

  if (loading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        วิเคราะห์ข้อมูล
      </Typography>

      {/* Device Selector */}
      <FormControl size="small" sx={{ minWidth: 240, mb: 3 }}>
        <InputLabel>อุปกรณ์</InputLabel>
        <Select
          value={deviceId}
          label="อุปกรณ์"
          onChange={(e) => { setDeviceId(e.target.value); setTab(0); }}
        >
          {devices.map((d) => (
            <MenuItem key={d.device_id} value={d.device_id}>{d.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {devices.length === 0 ? (
        <Alert severity="info">ยังไม่มีอุปกรณ์ในระบบ</Alert>
      ) : (
        <Card>
          <CardContent sx={{ pt: 1 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="สรุปข้อมูล" />
              <Tab label="แนวโน้ม" />
              <Tab label="เปรียบเทียบ" />
              <Tab label="คำแนะนำ" />
            </Tabs>

            <TabPanel value={tab} index={0}>
              <SummaryTab deviceId={deviceId} />
            </TabPanel>
            <TabPanel value={tab} index={1}>
              <TrendTab deviceId={deviceId} />
            </TabPanel>
            <TabPanel value={tab} index={2}>
              <CompareTab devices={devices} deviceId={deviceId} />
            </TabPanel>
            <TabPanel value={tab} index={3}>
              <RecommendationsTab deviceId={deviceId} />
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
