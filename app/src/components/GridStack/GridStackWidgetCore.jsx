import { useState, useEffect, useRef } from "react";
import { ICON, SENSORS_TYPE } from "../../services/global_variable";
import {
  IconButton,
  Paper,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import BoxLoading from "../BoxLoading";

import GenericSensor from "./sensors/GenericSensor";
import WidgetLiveWather from "./WidgetLiveWather";

const SENSOR_TYPES = Object.keys(SENSORS_TYPE);

export function GridStackWidgetCore({ deviceId, widget, onEdit, onDelete }) {
  const [widgetRef, setWidgetRef] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showButtons, setShowButtons] = useState(false);

  const containerRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    setIsLoading(true);
    setWidgetRef(widget);
    setIsLoading(false);
  }, []);

  const handleEditWidget = () => onEdit(widgetRef.id);
  const handleRemoveWidget = () => onDelete(widgetRef.id);

  const getWidgetCore = () => {
    if (SENSOR_TYPES.includes(widgetRef.type)) {
      return (
        <GenericSensor
          deviceId={deviceId}
          widget={widget}
          sensorType={widgetRef.type}
        />
      );
    }
    if (widgetRef.type === "weatherlive" || widgetRef.type === "watherlive") {
      return <WidgetLiveWather city={widgetRef?.city} containerRef={containerRef} />;
    }
    return false;
  };

  if (isLoading) {
    return <BoxLoading />;
  }

  return (
    <Paper
      ref={containerRef}
      elevation={3}
      sx={{
        p: 0,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        borderRadius: 3,
      }}
      onMouseEnter={() => setShowButtons(true)}
      onMouseLeave={() => setShowButtons(false)}
    >
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          borderRadius: 3,
          opacity: showButtons ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : theme.palette.grey[300],
        }}
      >
        <Tooltip title="แก้ไขวิดเจ็ต">
          <IconButton size="small" onClick={handleEditWidget} color={ICON.EDIT.color}>
            {ICON.EDIT.icon}
          </IconButton>
        </Tooltip>
        <Tooltip title="ลบวิดเจ็ต">
          <IconButton size="small" onClick={handleRemoveWidget} color={ICON.REMOVE.color}>
            {ICON.REMOVE.icon}
          </IconButton>
        </Tooltip>
      </Stack>

      {getWidgetCore()}
    </Paper>
  );
}
