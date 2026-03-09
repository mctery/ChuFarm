// src/components/GridStack/widgets/WidgetLiveWeather.jsx
import { useEffect, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Tooltip,
  Fade,
  useTheme,
  alpha,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import useResizeObserver from "@react-hook/resize-observer";

import BoxLoading from "../BoxLoading";
import apiClient from "../../services/apiClient";
import { WEATHER_ICON, WEATHER_COLORS, DEFAULT_CITY } from "../../services/global_variable";

/* ---------- helpers ---------- */
const formatDate = () => new Date().toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short",});
const formatTime = (unix, tzOffset = 0) => new Date((unix + tzOffset) * 1000).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });

export default function WidgetLiveWeather({ city = DEFAULT_CITY, containerRef }) {
  const theme = useTheme();

  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [width, setWidth] = useState(0);               // (ยังใช้ใน clamp font)

  useResizeObserver(containerRef, entry => setWidth(entry.contentRect.width));

  /* ---------- fetch ---------- */
  const fetchWeather = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/api/weather/${encodeURIComponent(city)}`);
      if (data.message !== "OK" || !data.data) throw new Error("Weather API error");

      const w = data.data;
      const iconCode = w.weather[0].icon;
      const mainCond = w.weather[0].main;

      setWeather({
        name:        w.name,
        iconNode:    WEATHER_ICON[iconCode] || WEATHER_ICON.DEFAULT,
        temp:        w.main.temp.toFixed(0),
        humidity:    w.main.humidity,
        wind:        w.wind.speed.toFixed(1),
        clouds:      w.clouds.all,
        description: w.weather[0].description,
        condition:   mainCond,
        updatedAt:   formatDate(),
        updatedTime: formatTime(w.dt, w.timezone),
      });
    } catch (err) {
      console.error("Error fetching weather:", err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWeather(); }, [city]);

  /* ---------- early skeleton / error ---------- */
  if (loading && !weather) return <BoxLoading variant="widget" />;
  if (!loading && !weather) {
    return (
      <Box sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", p: 2, bgcolor: "action.hover", borderRadius: 2, minHeight: 170 }}>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>ไม่สามารถโหลดข้อมูลสภาพอากาศได้</Typography>
        <IconButton size="small" onClick={fetchWeather}><RefreshIcon /></IconButton>
      </Box>
    );
  }

  /* ---------- styles ---------- */
  const bg        = theme.palette.primary.main;
  const tempFont  = `clamp(32px, ${Math.min(width / 7, 48)}px, 48px)`; // responsive
  const baseColor = WEATHER_COLORS[weather.condition] || theme.palette.primary.main;
  const gradient  = `linear-gradient(135deg, ${alpha(baseColor, 0.95)} 0%, ${alpha(baseColor, 0.75)} 100%)`;

  return (
    <Fade in={!loading} timeout={{ enter: 600, exit: 400 }} mountOnEnter unmountOnExit>
      <Box
        sx={{
          background: gradient,
          color: theme.palette.common.white,
          height: "100%",
          borderRadius: 2,
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: 3,
          minHeight: 170,
        }}
      >
        {/* ---------- header ---------- */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              background: theme.palette.common.white,
              color: bg,
              px: 1,
              py: 0.25,
              borderRadius: 1,
            }}
          >
            {weather.updatedAt}
          </Typography>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <LocationOnIcon fontSize="inherit" />
            <Typography variant="caption">{weather.name}</Typography>
          </Stack>
        </Stack>

        {/* ---------- temp & icon ---------- */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 0.5, flexWrap: "wrap" }}>
          <Box sx={{ fontSize: 50 }}>{weather.iconNode}</Box>
          <Typography sx={{ fontSize: tempFont, fontWeight: 700, lineHeight: 1 }}>{weather.temp}°</Typography>
          <Typography variant="h6" sx={{ textTransform: "capitalize", fontWeight: 400, flexShrink: 0 }}>{weather.description}</Typography>
        </Stack>

        {/* ---------- footer ---------- */}
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="caption">💧 {weather.humidity}% &nbsp;|&nbsp; 💨 {weather.wind} m/s &nbsp;|&nbsp; ☁️ {weather.clouds}%</Typography>
          <Tooltip title="รีเฟรช">
            <IconButton size="small" sx={{ color: theme.palette.common.white }} onClick={fetchWeather}><RefreshIcon fontSize="inherit" /></IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Fade>
  );
}
