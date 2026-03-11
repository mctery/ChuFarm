import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
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
  Divider,
  alpha,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import ScheduleIcon from "@mui/icons-material/Schedule";
import HistoryIcon from "@mui/icons-material/History";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { useSnackbar } from "notistack";
import apiClient from "../../services/apiClient";
import { SysGetDevices } from "../../services/device_service";
import SkeletonCardGrid from "../../components/SkeletonCardGrid";
import EmptyState from "../../components/EmptyState";
import DialogConfirm from "../../components/DialogConfirm";
import { ACTION_TYPES, CRON_PRESETS, DEFAULT_TIMEZONE } from "../../constants/automation";
import { formatDate } from "../../utils/dateFormat";

const emptyAction = () => ({
  type: "send_notification",
  device_id: "",
  command: "",
  message: "",
  payload: {},
});

export default function SchedulesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [devices, setDevices] = useState([]);

  // Dialog
  const dialog = useDialogState();
  const deleteDialog = useDialogState();
  const [form, setForm] = useState({
    name: "",
    description: "",
    cron_expression: "0 * * * *",
    cron_preset: "0 * * * *",
    timezone: DEFAULT_TIMEZONE,
    actions: [emptyAction()],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [logsDialog, setLogsDialog] = useState({ open: false, logs: [], name: "" });

  const fetchSchedules = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/schedules");
      setSchedules(data.data || []);
    } catch {
      enqueueSnackbar("โหลดข้อมูลไม่สำเร็จ", { variant: "error" });
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    const devs = await SysGetDevices();
    setDevices(devs);
  }, []);

  useEffect(() => {
    Promise.all([fetchSchedules(), fetchDevices()]).then(() =>
      setLoading(false)
    );
  }, [fetchSchedules, fetchDevices]);

  const openCreate = () => {
    setForm({
      name: "",
      description: "",
      cron_expression: "0 * * * *",
      cron_preset: "0 * * * *",
      timezone: DEFAULT_TIMEZONE,
      actions: [emptyAction()],
      is_active: true,
    });
    dialog.open(null);
  };

  const openEdit = (s) => {
    const preset = CRON_PRESETS.find((p) => p.value === s.cron_expression);
    setForm({
      name: s.name,
      description: s.description || "",
      cron_expression: s.cron_expression,
      cron_preset: preset ? s.cron_expression : "",
      timezone: s.timezone || DEFAULT_TIMEZONE,
      actions: s.actions.map((a) => ({ ...a })),
      is_active: s.is_active,
    });
    dialog.open(s);
  };

  const handleToggle = async (id) => {
    try {
      await apiClient.post(`/api/schedules/${id}/toggle`);
      setSchedules((prev) =>
        prev.map((s) =>
          s._id === id ? { ...s, is_active: !s.is_active } : s
        )
      );
    } catch {
      enqueueSnackbar("เปลี่ยนสถานะไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar("กรุณากรอกชื่อ", { variant: "warning" });
      return;
    }
    if (!form.cron_expression.trim()) {
      enqueueSnackbar("กรุณากำหนด Cron Expression", { variant: "warning" });
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      cron_expression: form.cron_expression,
      timezone: form.timezone,
      actions: form.actions,
      is_active: form.is_active,
    };

    try {
      if (dialog.state.item) {
        await apiClient.put(`/api/schedules/${dialog.state.item._id}`, payload);
        enqueueSnackbar("แก้ไข Schedule สำเร็จ", { variant: "success" });
      } else {
        await apiClient.post("/api/schedules", payload);
        enqueueSnackbar("สร้าง Schedule สำเร็จ", { variant: "success" });
      }
      dialog.close();
      fetchSchedules();
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด กรุณาตรวจสอบ Cron Expression", {
        variant: "error",
      });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/schedules/${deleteDialog.state.item}`);
      enqueueSnackbar("ลบ Schedule แล้ว", { variant: "success" });
      deleteDialog.close();
      fetchSchedules();
    } catch {
      enqueueSnackbar("ลบไม่สำเร็จ", { variant: "error" });
    }
  };

  const openLogs = async (s) => {
    try {
      const { data } = await apiClient.get(`/api/schedules/${s._id}/logs`);
      setLogsDialog({ open: true, logs: data.data || [], name: s.name });
    } catch {
      enqueueSnackbar("โหลด logs ไม่สำเร็จ", { variant: "error" });
    }
  };

  const updateAction = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      actions: f.actions.map((a, i) =>
        i === idx ? { ...a, [field]: value } : a
      ),
    }));
  };

  const addAction = () =>
    setForm((f) => ({ ...f, actions: [...f.actions, emptyAction()] }));

  const removeAction = (idx) =>
    setForm((f) => ({
      ...f,
      actions: f.actions.filter((_, i) => i !== idx),
    }));

  const handlePresetChange = (preset) => {
    setForm((f) => ({
      ...f,
      cron_preset: preset,
      cron_expression: preset || f.cron_expression,
    }));
  };


  if (loading) return <SkeletonCardGrid count={4} height={160} />;

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
            ตั้งเวลาทำงาน
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ตั้ง schedule สำหรับส่งคำสั่งหรือแจ้งเตือนตามเวลา
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={openCreate}
          color="success"
        >
          สร้าง Schedule
        </Button>
      </Stack>

      {schedules.length === 0 ? (
        <EmptyState
          icon={ScheduleIcon}
          title="ยังไม่มี Schedule"
          description="สร้าง schedule เพื่อตั้งเวลาส่งคำสั่งหรือแจ้งเตือนอัตโนมัติ"
          action={
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={openCreate} color="success">
              สร้าง Schedule แรก
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {schedules.map((s) => (
            <Paper
              key={s._id}
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
              <Switch
                checked={s.is_active}
                onChange={() => handleToggle(s._id)}
                size="small"
              />
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant="body1" fontWeight={600}>
                  {s.name}
                </Typography>
                {s.description && (
                  <Typography variant="caption" color="text.secondary">
                    {s.description}
                  </Typography>
                )}
              </Box>

              <Chip
                label={s.cron_expression}
                size="small"
                variant="outlined"
                color="info"
                sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
              />

              <Stack alignItems="flex-end" sx={{ minWidth: 120 }}>
                <Typography variant="caption" color="text.secondary">
                  ถัดไป: {formatDate(s.next_run)}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  ล่าสุด: {formatDate(s.last_run)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={0.5}>
                <Tooltip title="ดู Logs">
                  <IconButton size="small" onClick={() => openLogs(s)}>
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="แก้ไข">
                  <IconButton size="small" onClick={() => openEdit(s)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="ลบ">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => deleteDialog.open(s._id)}
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
        open={dialog.state.open}
        onClose={dialog.close}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog.state.item ? "แก้ไข Schedule" : "สร้าง Schedule"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="ชื่อ"
              fullWidth
              size="small"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <TextField
              label="คำอธิบาย"
              fullWidth
              size="small"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />

            <Divider />

            <Typography variant="subtitle2" fontWeight={700}>
              ตั้งเวลา
            </Typography>

            <TextField
              label="รูปแบบเวลา"
              select
              fullWidth
              size="small"
              value={form.cron_preset}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              {CRON_PRESETS.map((p) => (
                <MenuItem key={p.label} value={p.value}>
                  {p.label}
                  {p.value && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1, fontFamily: "monospace" }}
                    >
                      ({p.value})
                    </Typography>
                  )}
                </MenuItem>
              ))}
            </TextField>

            {form.cron_preset === "" && (
              <TextField
                label="Cron Expression (นิพจน์)"
                fullWidth
                size="small"
                value={form.cron_expression}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cron_expression: e.target.value }))
                }
                placeholder="*/5 * * * *"
                helperText="รูปแบบ: นาที ชั่วโมง วัน เดือน วันในสัปดาห์"
                slotProps={{
                  input: {
                    sx: { fontFamily: "monospace" },
                  },
                }}
              />
            )}

            <Divider />

            {/* Actions */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  การกระทำ
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addAction}
                >
                  เพิ่ม Action
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {form.actions.map((act, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: alpha(theme.palette.warning.main, 0.03),
                    }}
                  >
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          label="ประเภท"
                          select
                          fullWidth
                          size="small"
                          value={act.type}
                          onChange={(e) =>
                            updateAction(idx, "type", e.target.value)
                          }
                        >
                          {ACTION_TYPES.map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                              {t.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      {act.type === "device_command" && (
                        <>
                          <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                              label="อุปกรณ์"
                              select
                              fullWidth
                              size="small"
                              value={act.device_id}
                              onChange={(e) =>
                                updateAction(idx, "device_id", e.target.value)
                              }
                            >
                              {devices.map((d) => (
                                <MenuItem
                                  key={d.device_id}
                                  value={d.device_id}
                                >
                                  {d.name}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                              label="คำสั่ง"
                              fullWidth
                              size="small"
                              value={act.command}
                              onChange={(e) =>
                                updateAction(idx, "command", e.target.value)
                              }
                            />
                          </Grid>
                        </>
                      )}
                      {(act.type === "send_notification" ||
                        act.type === "log_event") && (
                        <Grid size={{ xs: 12, sm: 7 }}>
                          <TextField
                            label="ข้อความ"
                            fullWidth
                            size="small"
                            value={act.message}
                            onChange={(e) =>
                              updateAction(idx, "message", e.target.value)
                            }
                          />
                        </Grid>
                      )}
                      <Grid size="auto">
                        {form.actions.length > 1 && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeAction(idx)}
                          >
                            <RemoveCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={dialog.close}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {dialog.state.item ? "บันทึก" : "สร้าง"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog
        open={logsDialog.open}
        onClose={() => setLogsDialog({ open: false, logs: [], name: "" })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Logs: {logsDialog.name}
        </DialogTitle>
        <DialogContent dividers>
          {logsDialog.logs.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 3, textAlign: "center" }}
            >
              ยังไม่มีประวัติการทำงาน
            </Typography>
          ) : (
            <Stack spacing={1}>
              {logsDialog.logs.map((log) => (
                <Paper key={log._id} variant="outlined" sx={{ p: 1.5 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Chip
                      label={log.status || "executed"}
                      size="small"
                      color={log.status === "error" ? "error" : "success"}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.createdAt).toLocaleString("th-TH")}
                    </Typography>
                  </Stack>
                  {log.message && (
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {log.message}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setLogsDialog({ open: false, logs: [], name: "" })}
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      <DialogConfirm
        open={deleteDialog.state.open}
        title="ลบ Schedule?"
        content="ต้องการลบ schedule นี้หรือไม่?"
        handleClose={deleteDialog.close}
        handleConfirm={handleDelete}
      />
    </Box>
  );
}
