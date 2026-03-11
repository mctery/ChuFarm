import { useEffect, useMemo, useRef, useState, useReducer } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Stack,
  Tooltip,
  Divider,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  InputAdornment,
  Chip,
  Paper,
  alpha,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TimelineIcon from "@mui/icons-material/Timeline";
import WidgetsIcon from "@mui/icons-material/Widgets";
import SaveIcon from "@mui/icons-material/Save";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SensorsIcon from "@mui/icons-material/Sensors";
import ExtensionIcon from "@mui/icons-material/Extension";
import { useSnackbar } from "notistack";

import { GridStack } from "gridstack";
import { createPortal } from "react-dom";
import { GridStackWidgetCore } from "../../components/GridStack/GridStackWidgetCore";
import "gridstack/dist/gridstack.min.css";

import DialogConfirm from "../../components/DialogConfirm";
import DrawerWidgetManager from "../../components/GridStack/DrawerWidgetManager";

import {
  getWidgetLayout,
  saveWidgetLayout,
  deleteWidgetLayout,
} from "../../services/widget_service";
import { SysGetDeviceSensorsById } from "../../services/sensor_service";
import { SysGetDeviceById } from "../../services/device_service";
import { GRID_CONFIG, buildDeviceTopics } from "../../services/global_variable";
import { getUserInfo } from "../../services/storage_service";
import { ROUTES } from "../../constants/routes";

import { MqttProvider } from "../../components/GridStack/context/MqttProvider";

export default function FarmGridStackOverview() {
  const { deviceId } = useParams();
  const navigate = useNavigate();
  const gridRef = useRef(null);
  const grid = useRef(null);
  const nextId = useRef(1);
  const isSavingRef = useRef(false);
  const widgetContainersRef = useRef(new Map());
  const theme = useTheme();
  const [, forceRender] = useReducer((x) => x + 1, 0);

  const CURRENT_USER_ID = getUserInfo()?.user_id;
  const [deviceName, setDeviceName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [widgets, setWidgets] = useState([]);
  const [sensors, setSensors] = useState([]);
  const [locked, setLocked] = useState(false);

  const [openDrawerSensors, setOpenDrawerSensors] = useState(false);
  const [openDialogOtherWidget, setOpenDialogOtherWidget] = useState(false);
  const [openDialogWidgetRemove, setDialogWidgetRemove] = useState(false);

  const [edit, setEdit] = useState({
    open: false,
    id: null,
    type: "",
    title: "",
    bgcolor: "",
    unit: "",
    max: "",
    min: "",
    ratio: "",
  });

  const mqttTopics = useMemo(() => buildDeviceTopics(deviceId), [deviceId]);

  const { enqueueSnackbar } = useSnackbar();

  const refreshSensors = async () => {
    const latest = await SysGetDeviceSensorsById(deviceId);
    setSensors(latest);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [sensors, widgets, device] = await Promise.all([
        SysGetDeviceSensorsById(deviceId),
        getWidgetLayout(deviceId),
        SysGetDeviceById(deviceId),
      ]);
      const maxId = widgets.reduce((m, w) => (w.id > m ? w.id : m), 0);
      nextId.current = maxId + 1;

      if (device) setDeviceName(device.name);

      setSensors(sensors);
      setWidgets(widgets);
      setIsLoading(false);
    };
    fetchData();
  }, [deviceId]);

  useEffect(() => {
    if (!gridRef.current || isSavingRef.current) return;

    const containers = widgetContainersRef.current;
    containers.clear();

    if (grid.current) {
      grid.current.destroy(false);
      grid.current = null;
    }

    grid.current = GridStack.init(
      {
        column: GRID_CONFIG.column,
        cellHeight: GRID_CONFIG.cellHeight,
        float: true,
        margin: GRID_CONFIG.margin,
        disableOneColumnMode: true,
        staticGrid: locked,
      },
      gridRef.current
    );

    grid.current.removeAll(true);
    widgets.forEach(addWidgetToGrid);
    forceRender();

    return () => {
      grid.current?.destroy(false);
      grid.current = null;
      containers.clear();
    };
  }, [widgets, locked]);

  const addWidgetToGrid = (widget) => {
    if (!grid.current) return;

    const wrapper = document.createElement("div");
    wrapper.classList.add("grid-stack-item");
    wrapper.setAttribute("gs-x", widget.x);
    wrapper.setAttribute("gs-y", widget.y);
    wrapper.setAttribute("gs-w", widget.w);
    wrapper.setAttribute("gs-h", widget.h);
    wrapper.setAttribute("gs-id", widget.id);

    const contentDiv = document.createElement("div");
    contentDiv.classList.add("grid-stack-item-content");
    wrapper.appendChild(contentDiv);
    grid.current.makeWidget(wrapper);

    widgetContainersRef.current.set(widget.id, contentDiv);
  };

  const handleUpdateLayout = async () => {
    try {
      if (!grid.current) return;

      const domNodes = grid.current.el.querySelectorAll(".grid-stack-item");
      const updated = widgets.map((w) => {
        const el = Array.from(domNodes).find(
          (el) => parseInt(el.getAttribute("gs-id")) === w.id
        );
        const node = el?.gridstackNode;
        return node
          ? { ...w, x: node.x, y: node.y, w: node.w, h: node.h }
          : w;
      });

      setWidgets(updated);
      await saveWidgetLayout(deviceId, updated);
      enqueueSnackbar("บันทึกผังวิดเจ็ตเรียบร้อยแล้ว", { variant: "success" });
    } catch (error) {
      enqueueSnackbar(`เกิดข้อผิดพลาด: ${error}`, { variant: "error" });
    }
  };

  const handleAddWidget = (payload) => {
    setWidgets((prev) => [...prev, payload]);
    nextId.current += 1;
  };

  const handleAddSensor = async (sensor) => {
    handleAddWidget({
      id: nextId.current,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      title: `${sensor.sensor_name}`,
      type: `${sensor.sensor_type}`,
      sensorKey: `${sensor.sensor_id}`,
      unit: `${sensor.unit}`,
      bgcolor: `${sensor.bgcolor}`,
      max: `${sensor.max}`,
      min: `${sensor.min}`,
      ratio: `${sensor.ratio}`,
    });
    await refreshSensors();
  };

  const handleUpdateSensor = async () => {
    await refreshSensors();
  };
  const handleDeleteSensor = async () => {
    await refreshSensors();
  };

  const handleRemoveWidget = (id) => {
    widgetContainersRef.current.delete(id);
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleEditWidget = (id) => {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;

    setEdit({
      open: true,
      id,
      title: widget.title ?? "",
      type: widget.type ?? "",
      bgcolor: widget.bgcolor ?? "",
      unit: widget.unit ?? "",
      max: widget.max ?? "",
      min: widget.min ?? "",
      ratio: widget.ratio ?? "",
    });
  };

  const handleSaveWidgetConfig = async () => {
    const updated = widgets.map((w) =>
      w.id === edit.id
        ? { ...w, title: edit.title, type: edit.type, bgcolor: edit.bgcolor, unit: edit.unit, max: edit.max, min: edit.min, ratio: edit.ratio }
        : w
    );
    setWidgets(updated);
    setEdit((prev) => ({ ...prev, open: false }));
    try {
      await saveWidgetLayout(deviceId, updated);
      enqueueSnackbar("บันทึกการตั้งค่าวิดเจ็ตเรียบร้อยแล้ว", { variant: "success" });
    } catch {
      enqueueSnackbar("บันทึกการตั้งค่าไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleCloseEdit = () =>
    setEdit((prev) => ({ ...prev, open: false }));

  const handleClearLayout = async () => {
    try {
      widgetContainersRef.current.clear();
      await deleteWidgetLayout(deviceId);
      setWidgets([]);
      setDialogWidgetRemove(false);
    } catch (error) {
      console.error("error handleClearLayout:", error);
    }
  };

  const toggleLock = () => setLocked((prev) => !prev);

  if (isLoading) return <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

  return (
    <MqttProvider topics={mqttTopics} deviceId={deviceId}>
      <Box>
        {/* Edit Widget Dialog */}
        <Dialog
          open={edit.open}
          onClose={handleCloseEdit}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle sx={{ fontWeight: 700 }}>แก้ไขวิดเจ็ต</DialogTitle>

          <DialogContent dividers>
            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={600}
            >
              ลักษณะทั่วไป
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ประเภทวิดเจ็ต"
                  fullWidth
                  size="small"
                  value={edit.type}
                  disabled
                  helperText="ตั้งค่าตามชนิดวิดเจ็ต"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ชื่อวิดเจ็ต"
                  fullWidth
                  size="small"
                  value={edit.title}
                  placeholder="เช่น Soil Moisture"
                  helperText="ชื่อที่จะแสดงบนการ์ด"
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="พื้นหลัง"
                    type="color"
                    size="small"
                    value={edit.bgcolor}
                    onChange={(e) =>
                      setEdit((prev) => ({
                        ...prev,
                        bgcolor: e.target.value,
                      }))
                    }
                    sx={{ width: 120 }}
                  />
                  <TextField
                    label="รหัสสี (Hex)"
                    size="small"
                    fullWidth
                    value={edit.bgcolor}
                    onChange={(e) =>
                      setEdit((prev) => ({
                        ...prev,
                        bgcolor: e.target.value,
                      }))
                    }
                    placeholder="#2196f3"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: 0.5,
                              bgcolor: edit.bgcolor || "#2196f3",
                              mr: 1,
                              border: "1px solid",
                              borderColor: "divider",
                              flexShrink: 0,
                            }}
                          />
                        ),
                      },
                    }}
                  />
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="หน่วย (Unit)"
                  fullWidth
                  size="small"
                  value={edit.unit}
                  placeholder="เช่น %, °C, ppm"
                  helperText="จะแสดงคู่กับค่า Min/Max"
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, unit: e.target.value }))
                  }
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ตัวคูณ (Ratio)"
                  fullWidth
                  size="small"
                  type="number"
                  value={edit.ratio}
                  placeholder="เช่น 0.1, 2"
                  helperText="คูณค่าดิบก่อนแสดง (ว่างคือ ×1)"
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, ratio: e.target.value }))
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="overline"
              color="text.secondary"
              fontWeight={600}
            >
              สเกลค่า
            </Typography>

            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ค่าต่ำสุด (Min)"
                  fullWidth
                  size="small"
                  type="number"
                  value={edit.min}
                  placeholder="เช่น 0"
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, min: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      endAdornment: edit.unit ? (
                        <InputAdornment position="end">
                          {edit.unit}
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  helperText="จุดเริ่มต้นของสเกล"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ค่าสูงสุด (Max)"
                  fullWidth
                  size="small"
                  type="number"
                  value={edit.max}
                  placeholder="เช่น 100"
                  onChange={(e) =>
                    setEdit((prev) => ({ ...prev, max: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      endAdornment: edit.unit ? (
                        <InputAdornment position="end">
                          {edit.unit}
                        </InputAdornment>
                      ) : null,
                    },
                  }}
                  helperText="จุดสิ้นสุดของสเกล"
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseEdit}>ยกเลิก</Button>
            <Button
              variant="contained"
              onClick={handleSaveWidgetConfig}
              disabled={edit.title.trim() === ""}
            >
              บันทึก
            </Button>
          </DialogActions>
        </Dialog>

        <DialogConfirm
          open={openDialogWidgetRemove}
          title="ลบผังวิดเจ็ตทั้งหมด?"
          content="คุณต้องการลบวิดเจ็ตทั้งหมดออกจากหน้าจอหรือไม่?"
          handleClose={() => setDialogWidgetRemove(false)}
          handleConfirm={handleClearLayout}
        />

        {/* Header */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Tooltip title="กลับไปหน้าอุปกรณ์">
              <IconButton
                onClick={() => navigate(ROUTES.DEVICES)}
                size="small"
                sx={{ bgcolor: "action.hover" }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
                  {deviceName || deviceId}
                </Typography>
                <Chip
                  label={`${widgets.length} วิดเจ็ต`}
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: "0.7rem" }}
                />
              </Stack>
              {deviceName && (
                <Typography variant="caption" color="text.secondary">
                  {deviceId}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Button
              onClick={() => navigate(ROUTES.HISTORY(deviceId))}
              variant="outlined"
              size="small"
              startIcon={<TimelineIcon />}
              color="info"
            >
              ประวัติข้อมูล
            </Button>
          </Stack>
        </Stack>

        {/* Toolbar */}
        <Paper
          variant="outlined"
          sx={{
            px: 1.5,
            py: 1,
            mb: 2,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Button
            onClick={() => setOpenDrawerSensors(true)}
            variant="contained"
            size="small"
            startIcon={<SensorsIcon />}
            color="success"
          >
            เซ็นเซอร์
          </Button>
          <Button
            onClick={() => setOpenDialogOtherWidget(true)}
            variant="contained"
            size="small"
            startIcon={<ExtensionIcon />}
            color="success"
          >
            วิดเจ็ตอื่นๆ
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Button
            onClick={handleUpdateLayout}
            variant="contained"
            size="small"
            startIcon={<SaveIcon />}
            disabled={widgets.length === 0}
          >
            บันทึกตำแหน่ง
          </Button>

          <Tooltip title={locked ? "ปลดล็อคเพื่อแก้ไขตำแหน่ง" : "ล็อคตำแหน่งวิดเจ็ต"}>
            <IconButton
              size="small"
              onClick={toggleLock}
              color={locked ? "warning" : "default"}
              sx={{
                bgcolor: locked
                  ? (t) => alpha(t.palette.warning.main, 0.1)
                  : "action.hover",
              }}
            >
              {locked ? <LockIcon fontSize="small" /> : <LockOpenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Box sx={{ flex: 1 }} />

          <Button
            onClick={() => setDialogWidgetRemove(true)}
            size="small"
            color="error"
            startIcon={<DeleteSweepIcon />}
            disabled={widgets.length === 0}
          >
            ลบทั้งหมด
          </Button>
        </Paper>

        {/* Drawers */}
        <DrawerWidgetManager
          type="sensor"
          deviceId={deviceId}
          open={openDrawerSensors}
          sensors={sensors}
          onClose={() => setOpenDrawerSensors(false)}
          onAddSensor={handleAddSensor}
          onUpdateSensor={handleUpdateSensor}
          onDeleteSensor={handleDeleteSensor}
        />

        <DrawerWidgetManager
          type="other"
          deviceId={deviceId}
          open={openDialogOtherWidget}
          sensors={sensors}
          onClose={() => setOpenDialogOtherWidget(false)}
          onAddSensor={handleAddSensor}
          onUpdateSensor={handleUpdateSensor}
          onDeleteSensor={handleDeleteSensor}
        />

        {/* Grid Area */}
        <Box
          sx={{
            width: "100%",
            minHeight: "75vh",
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.background.paper, 0.3)
                : theme.palette.grey[100],
            borderRadius: 2,
            border: "2px dashed",
            borderColor: "divider",
            position: "relative",
          }}
        >
          <div className="grid-stack" ref={gridRef} />
          {widgets.length === 0 && (
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              <WidgetsIcon
                sx={{ fontSize: 64, color: "text.disabled", mb: 1.5 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                ยังไม่มีวิดเจ็ต
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mb: 2.5 }}>
                กดปุ่ม "เซ็นเซอร์" หรือ "วิดเจ็ตอื่นๆ" ด้านบนเพื่อเริ่มต้น
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ pointerEvents: "auto" }}
              >
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<SensorsIcon />}
                  color="success"
                  onClick={() => setOpenDrawerSensors(true)}
                >
                  เพิ่มเซ็นเซอร์
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExtensionIcon />}
                  onClick={() => setOpenDialogOtherWidget(true)}
                >
                  เพิ่มวิดเจ็ต
                </Button>
              </Stack>
            </Stack>
          )}
          {widgets.map((w) => {
            const container = widgetContainersRef.current.get(w.id);
            return (
              container &&
              createPortal(
                <GridStackWidgetCore
                  key={w.id}
                  deviceId={deviceId}
                  widget={w}
                  onEdit={handleEditWidget}
                  onDelete={handleRemoveWidget}
                />,
                container
              )
            );
          })}
        </Box>
      </Box>
    </MqttProvider>
  );
}
