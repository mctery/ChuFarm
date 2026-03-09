import React from "react";
import { Stack, Typography, Box, Divider, useTheme } from "@mui/material";
import SensorFrame from "./SensorFrame";
import { formatValue } from "../utils/number";

import { alpha } from "@mui/material/styles";
import { Gauge, gaugeClasses } from "@mui/x-charts/Gauge";

export default function SensorCard({
  icon,
  value,
  unit,
  title,
  deviceId,
  sensorKey,
  loading,
  bgcolor,
  CenterIcon,
  max,
  min,
  variant = "gauge",
}) {
  const theme = useTheme();

  return (
    <SensorFrame loading={loading} bgcolor={bgcolor}>
      {/* header */}
      <Stack direction="row" spacing={0.5} alignItems="center">
        <CenterIcon sx={{ fontSize: 36 }} />
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>

      <Gauge
        value={value}
        startAngle={-120}
        endAngle={120}
        valueMin={min}
        valueMax={max}
        innerRadius="80%"
        outerRadius="100%"
        cornerRadius="50%"
        sx={{
          [`& .${gaugeClasses.valueArc}`]: {
            fill: theme.palette.common.white,
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: alpha(theme.palette.common.white, 0.25),
          },
          [`& .${gaugeClasses.valueText}`]: {
            display: "none",
          },
        }}
      >
        <text x="15%" y="95%" textAnchor="middle" fontSize="12" fill="white">
          {variant === "light" ? formatValue(min) : min}
        </text>
        <text x="85%" y="95%" textAnchor="middle" fontSize="12" fill="white">
          {variant === "light" ? formatValue(max) : max}
        </text>
      </Gauge>

      {/* value */}
      <Box
        sx={{
          position: "absolute",
          top: "54%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          mt: 0.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, mt: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1 }}>
            {formatValue(value)}
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.8, lineHeight: 1 }}>
            {unit}
          </Typography>
        </Box>
      </Box>

      {/* footer */}
      <Divider sx={{ my: 0.5, borderColor: alpha(theme.palette.common.white, 0.25) }} />
      <Typography
        variant="caption"
        sx={{
          opacity: 0.8,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {deviceId ?? "-"} | {sensorKey ?? "-"}
      </Typography>
    </SensorFrame>
  );
}
