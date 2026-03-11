import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import SearchIcon from "@mui/icons-material/Search";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useSnackbar } from "notistack";

import SkeletonCardGrid from "../../components/SkeletonCardGrid";
import EmptyState from "../../components/EmptyState";
import DialogConfirm from "../../components/DialogConfirm";
import {
  SysGetDeviceProfiles,
  SysCreateDeviceProfile,
  SysUpdateDeviceProfile,
  SysDeleteDeviceProfile,
} from "../../services/device_profile_service";

const SENSOR_TYPES = ["temperature", "humidity", "light", "soil"];

const SENSOR_LABELS = {
  temperature: "อุณหภูมิ",
  humidity: "ความชื้น",
  light: "แสง",
  soil: "ความชื้นดิน",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  expected_sensors: [],
  checkin_interval: 60,
  default_thresholds: [],
};

const EMPTY_THRESHOLD = { sensor_type: "", min_value: "", max_value: "" };

export default function DeviceProfilesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState("");

  const dialog = useDialogState();
  const deleteDialog = useDialogState();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProfiles = useCallback(async () => {
    const data = await SysGetDeviceProfiles();
    setProfiles(data);
  }, []);

  useEffect(() => {
    fetchProfiles().then(() => setLoading(false));
  }, [fetchProfiles]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    dialog.open(null);
  }

  function openEdit(profile) {
    setForm({
      name: profile.name || "",
      description: profile.description || "",
      expected_sensors: profile.expected_sensors || [],
      checkin_interval: profile.checkin_interval ?? 60,
      default_thresholds: (profile.default_thresholds || []).map((t) => ({
        sensor_type: t.sensor_type || "",
        min_value: t.min_value ?? "",
        max_value: t.max_value ?? "",
      })),
    });
    setErrors({});
    dialog.open(profile);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function toggleSensor(type) {
    setForm((prev) => ({
      ...prev,
      expected_sensors: prev.expected_sensors.includes(type)
        ? prev.expected_sensors.filter((s) => s !== type)
        : [...prev.expected_sensors, type],
    }));
  }

  function addThreshold() {
    setForm((prev) => ({
      ...prev,
      default_thresholds: [...prev.default_thresholds, { ...EMPTY_THRESHOLD }],
    }));
  }

  function removeThreshold(idx) {
    setForm((prev) => ({
      ...prev,
      default_thresholds: prev.default_thresholds.filter((_, i) => i !== idx),
    }));
  }

  function handleThresholdChange(idx, field, value) {
    setForm((prev) => {
      const thresholds = [...prev.default_thresholds];
      thresholds[idx] = { ...thresholds[idx], [field]: value };
      return { ...prev, default_thresholds: thresholds };
    });
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "กรุณากรอกชื่อโปรไฟล์";
    if (Number(form.checkin_interval) < 10) errs.checkin_interval = "ต้องมากกว่า 10 วินาที";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        expected_sensors: form.expected_sensors,
        checkin_interval: Number(form.checkin_interval),
        default_thresholds: form.default_thresholds
          .filter((t) => t.sensor_type)
          .map((t) => ({
            sensor_type: t.sensor_type,
            min_value: t.min_value !== "" ? Number(t.min_value) : undefined,
            max_value: t.max_value !== "" ? Number(t.max_value) : undefined,
          })),
      };

      let result;
      if (dialog.state.item) {
        result = await SysUpdateDeviceProfile(dialog.state.item._id, payload);
      } else {
        result = await SysCreateDeviceProfile(payload);
      }

      if (result) {
        enqueueSnackbar(dialog.state.item ? "แก้ไขโปรไฟล์สำเร็จ" : "สร้างโปรไฟล์สำเร็จ", { variant: "success" });
        dialog.close();
        await fetchProfiles();
      } else {
        enqueueSnackbar("บันทึกข้อมูลไม่สำเร็จ", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.state.item) return;
    setDeleting(true);
    const ok = await SysDeleteDeviceProfile(deleteDialog.state.item._id);
    setDeleting(false);
    if (ok) {
      enqueueSnackbar("ลบโปรไฟล์สำเร็จ", { variant: "success" });
      deleteDialog.close();
      await fetchProfiles();
    } else {
      enqueueSnackbar("ลบโปรไฟล์ไม่สำเร็จ", { variant: "error" });
    }
  }

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <SkeletonCardGrid count={6} height={180} />;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            โปรไฟล์อุปกรณ์
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profiles.length} โปรไฟล์
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          เพิ่มโปรไฟล์
        </Button>
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="ค้นหาโปรไฟล์..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3, maxWidth: 320 }}
      />

      {/* Profile Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={DeviceHubIcon}
          title={search ? "ไม่พบโปรไฟล์ที่ค้นหา" : "ยังไม่มีโปรไฟล์"}
          description={!search ? "กดเพิ่มโปรไฟล์เพื่อเริ่มต้น" : undefined}
          variant={search ? "search" : "page"}
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((profile) => (
            <Grid key={profile._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                        bgcolor: "primary.light", display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <DeviceHubIcon sx={{ color: "primary.contrastText", fontSize: 22 }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap>
                        {profile.name}
                      </Typography>
                      {profile.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 2,
                            overflow: "hidden",
                            mb: 1,
                          }}
                        >
                          {profile.description}
                        </Typography>
                      )}
                      {/* Expected sensors */}
                      {profile.expected_sensors?.length > 0 && (
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} mb={1}>
                          {profile.expected_sensors.map((s) => (
                            <Chip
                              key={s}
                              label={SENSOR_LABELS[s] || s}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Checkin: {profile.checkin_interval ?? 60} วินาที
                        {profile.default_thresholds?.length > 0 && ` · ${profile.default_thresholds.length} threshold`}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <Box sx={{ px: 1.5, pb: 1.5, display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                  <Tooltip title="แก้ไข">
                    <IconButton size="small" onClick={() => openEdit(profile)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton size="small" color="error" onClick={() => deleteDialog.open(profile)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.state.open} onClose={dialog.close} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>{dialog.state.item ? "แก้ไขโปรไฟล์" : "เพิ่มโปรไฟล์ใหม่"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="ชื่อโปรไฟล์"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              size="small"
              autoFocus
            />
            <TextField
              label="คำอธิบาย"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <TextField
              label="รอบเช็คอิน (วินาที)"
              name="checkin_interval"
              type="number"
              value={form.checkin_interval}
              onChange={handleChange}
              error={!!errors.checkin_interval}
              helperText={errors.checkin_interval}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 10, step: 10 } }}
            />

            {/* Expected sensors */}
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                เซ็นเซอร์ที่คาดหวัง
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5}>
                {SENSOR_TYPES.map((type) => (
                  <Chip
                    key={type}
                    label={SENSOR_LABELS[type]}
                    size="small"
                    color={form.expected_sensors.includes(type) ? "primary" : "default"}
                    variant={form.expected_sensors.includes(type) ? "filled" : "outlined"}
                    onClick={() => toggleSensor(type)}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Default thresholds */}
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Threshold เริ่มต้น
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                  onClick={addThreshold}
                  sx={{ textTransform: "none", fontSize: "0.75rem" }}
                >
                  เพิ่ม
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {form.default_thresholds.map((t, idx) => (
                  <Stack key={idx} direction="row" spacing={1} alignItems="center">
                    <TextField
                      select
                      size="small"
                      label="ประเภท"
                      value={t.sensor_type}
                      onChange={(e) => handleThresholdChange(idx, "sensor_type", e.target.value)}
                      sx={{ minWidth: 110 }}
                      slotProps={{ select: { native: true } }}
                    >
                      <option value="">เลือก</option>
                      {SENSOR_TYPES.map((s) => (
                        <option key={s} value={s}>{SENSOR_LABELS[s]}</option>
                      ))}
                    </TextField>
                    <TextField
                      size="small"
                      label="ต่ำสุด"
                      type="number"
                      value={t.min_value}
                      onChange={(e) => handleThresholdChange(idx, "min_value", e.target.value)}
                      sx={{ width: 80 }}
                    />
                    <TextField
                      size="small"
                      label="สูงสุด"
                      type="number"
                      value={t.max_value}
                      onChange={(e) => handleThresholdChange(idx, "max_value", e.target.value)}
                      sx={{ width: 80 }}
                    />
                    <IconButton size="small" color="error" onClick={() => removeThreshold(idx)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                {form.default_thresholds.length === 0 && (
                  <Typography variant="caption" color="text.disabled">
                    ยังไม่มี threshold
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.close} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" loading={saving}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <DialogConfirm
        open={deleteDialog.state.open}
        title="ยืนยันการลบโปรไฟล์"
        content={`คุณต้องการลบโปรไฟล์ "${deleteDialog.state.item?.name}" ใช่หรือไม่?`}
        handleConfirm={handleDelete}
        handleClose={deleteDialog.close}
        loading={deleting}
        confirmColor="error"
      />
    </Box>
  );
}
