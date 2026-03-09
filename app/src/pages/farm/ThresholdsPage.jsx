import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  InputAdornment,
  alpha,
  useTheme,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import TuneIcon from "@mui/icons-material/Tune";
import SensorsIcon from "@mui/icons-material/Sensors";
import { useSnackbar } from "notistack";
import apiClient from "../../services/apiClient";
import { getUserInfo } from "../../services/storage_service";
import { SysGetDevices } from "../../services/device_service";
import { SysGetDeviceSensorsById } from "../../services/sensor_service";
import BoxLoading from "../../components/BoxLoading";
import DialogConfirm from "../../components/DialogConfirm";

const NOTIFY_OPTIONS = [
  { value: "in_app", label: "ในแอป" },
  { value: "push", label: "Push" },
  { value: "both", label: "ทั้งหมด" },
];

export default function ThresholdsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const userId = getUserInfo()?.user_id;

  const [loading, setLoading] = useState(true);
  const [thresholds, setThresholds] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sensors, setSensors] = useState([]);

  // Dialog state
  const [dialog, setDialog] = useState({ open: false, threshold: null });
  const [form, setForm] = useState({
    device_id: "",
    sensor_id: "",
    min_value: "",
    max_value: "",
    notify_type: "in_app",
  });
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const fetchThresholds = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await apiClient.get(`/api/thresholds/user/${userId}`);
      setThresholds(data.data || []);
    } catch {
      enqueueSnackbar("โหลดข้อมูลไม่สำเร็จ", { variant: "error" });
    }
  }, [userId]);

  const fetchDevices = useCallback(async () => {
    const devs = await SysGetDevices();
    setDevices(devs);
  }, []);

  useEffect(() => {
    Promise.all([fetchThresholds(), fetchDevices()]).then(() =>
      setLoading(false)
    );
  }, [fetchThresholds, fetchDevices]);

  const handleDeviceChange = async (deviceId) => {
    setForm((f) => ({ ...f, device_id: deviceId, sensor_id: "" }));
    if (deviceId) {
      const s = await SysGetDeviceSensorsById(deviceId);
      setSensors(s || []);
    } else {
      setSensors([]);
    }
  };

  const openCreate = () => {
    setForm({
      device_id: "",
      sensor_id: "",
      min_value: "",
      max_value: "",
      notify_type: "in_app",
    });
    setSensors([]);
    setDialog({ open: true, threshold: null });
  };

  const openEdit = async (t) => {
    setForm({
      device_id: t.device_id,
      sensor_id: t.sensor_id,
      min_value: t.min_value ?? "",
      max_value: t.max_value ?? "",
      notify_type: t.notify_type || "in_app",
    });
    if (t.device_id) {
      const s = await SysGetDeviceSensorsById(t.device_id);
      setSensors(s || []);
    }
    setDialog({ open: true, threshold: t });
  };

  const handleSave = async () => {
    if (!form.device_id || !form.sensor_id) {
      enqueueSnackbar("กรุณาเลือกอุปกรณ์และเซ็นเซอร์", { variant: "warning" });
      return;
    }
    if (form.min_value === "" && form.max_value === "") {
      enqueueSnackbar("กรุณากำหนดค่า Min หรือ Max อย่างน้อย 1 ค่า", {
        variant: "warning",
      });
      return;
    }

    setSaving(true);
    const payload = {
      device_id: form.device_id,
      sensor_id: form.sensor_id,
      user_id: userId,
      min_value: form.min_value !== "" ? Number(form.min_value) : null,
      max_value: form.max_value !== "" ? Number(form.max_value) : null,
      notify_type: form.notify_type,
    };

    try {
      if (dialog.threshold) {
        await apiClient.put(`/api/thresholds/${dialog.threshold._id}`, payload);
        enqueueSnackbar("แก้ไข Threshold สำเร็จ", { variant: "success" });
      } else {
        await apiClient.post("/api/thresholds", payload);
        enqueueSnackbar("สร้าง Threshold สำเร็จ", { variant: "success" });
      }
      setDialog({ open: false, threshold: null });
      fetchThresholds();
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/thresholds/${deleteDialog.id}`);
      enqueueSnackbar("ลบ Threshold แล้ว", { variant: "success" });
      setDeleteDialog({ open: false, id: null });
      fetchThresholds();
    } catch {
      enqueueSnackbar("ลบไม่สำเร็จ", { variant: "error" });
    }
  };

  const getDeviceName = (id) =>
    devices.find((d) => d.device_id === id)?.name || id;

  if (loading) return <BoxLoading />;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            ตั้งค่าแจ้งเตือนเซ็นเซอร์
          </Typography>
          <Typography variant="body2" color="text.secondary">
            กำหนดค่า min/max สำหรับแจ้งเตือนเมื่อค่าเซ็นเซอร์ผิดปกติ
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={openCreate}
          color="success"
        >
          เพิ่ม Threshold
        </Button>
      </Stack>

      {thresholds.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <TuneIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ยังไม่มี Threshold
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            เพิ่ม threshold เพื่อรับแจ้งเตือนเมื่อค่าเซ็นเซอร์เกินค่าที่กำหนด
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={openCreate}
            color="success"
          >
            เพิ่ม Threshold แรก
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {thresholds.map((t) => (
            <Paper
              key={t._id}
              variant="outlined"
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <SensorsIcon color="primary" />
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant="body1" fontWeight={600}>
                  {getDeviceName(t.device_id)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sensor: {t.sensor_id}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                {t.min_value != null && (
                  <Chip
                    label={`Min: ${t.min_value}`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
                {t.max_value != null && (
                  <Chip
                    label={`Max: ${t.max_value}`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                )}
                <Chip
                  label={
                    NOTIFY_OPTIONS.find((o) => o.value === t.notify_type)
                      ?.label || t.notify_type
                  }
                  size="small"
                  variant="outlined"
                />
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <Tooltip title="แก้ไข">
                  <IconButton size="small" onClick={() => openEdit(t)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="ลบ">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() =>
                      setDeleteDialog({ open: true, id: t._id })
                    }
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ open: false, threshold: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog.threshold ? "แก้ไข Threshold" : "เพิ่ม Threshold"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="อุปกรณ์"
              select
              fullWidth
              size="small"
              value={form.device_id}
              onChange={(e) => handleDeviceChange(e.target.value)}
              disabled={!!dialog.threshold}
            >
              {devices.map((d) => (
                <MenuItem key={d.device_id} value={d.device_id}>
                  {d.name} ({d.device_id})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="เซ็นเซอร์"
              select
              fullWidth
              size="small"
              value={form.sensor_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, sensor_id: e.target.value }))
              }
              disabled={!form.device_id || !!dialog.threshold}
            >
              {sensors.map((s) => (
                <MenuItem key={s.sensor_id} value={s.sensor_id}>
                  {s.sensor_name} ({s.sensor_type})
                </MenuItem>
              ))}
            </TextField>

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="ค่าต่ำสุด (Min)"
                  type="number"
                  fullWidth
                  size="small"
                  value={form.min_value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, min_value: e.target.value }))
                  }
                  helperText="แจ้งเตือนเมื่อค่าต่ำกว่านี้"
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="ค่าสูงสุด (Max)"
                  type="number"
                  fullWidth
                  size="small"
                  value={form.max_value}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_value: e.target.value }))
                  }
                  helperText="แจ้งเตือนเมื่อค่าสูงกว่านี้"
                />
              </Grid>
            </Grid>

            <TextField
              label="วิธีแจ้งเตือน"
              select
              fullWidth
              size="small"
              value={form.notify_type}
              onChange={(e) =>
                setForm((f) => ({ ...f, notify_type: e.target.value }))
              }
            >
              {NOTIFY_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setDialog({ open: false, threshold: null })}
          >
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {dialog.threshold ? "บันทึก" : "สร้าง"}
          </Button>
        </DialogActions>
      </Dialog>

      <DialogConfirm
        open={deleteDialog.open}
        title="ลบ Threshold?"
        content="ต้องการลบ threshold นี้หรือไม่?"
        handleClose={() => setDeleteDialog({ open: false, id: null })}
        handleConfirm={handleDelete}
      />
    </Box>
  );
}
