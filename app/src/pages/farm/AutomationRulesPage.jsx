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
  Collapse,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import HistoryIcon from "@mui/icons-material/History";
import { useSnackbar } from "notistack";
import apiClient from "../../services/apiClient";
import { SysGetDevices } from "../../services/device_service";
import { SysGetDeviceSensorsById } from "../../services/sensor_service";
import SkeletonCardGrid from "../../components/SkeletonCardGrid";
import EmptyState from "../../components/EmptyState";
import DialogConfirm from "../../components/DialogConfirm";
import { OPERATORS, ACTION_TYPES } from "../../constants/automation";

const emptyCondition = () => ({
  type: "sensor_value",
  device_id: "",
  sensor_id: "",
  operator: "gt",
  value: "",
  logic: "AND",
});

const emptyAction = () => ({
  type: "send_notification",
  device_id: "",
  command: "",
  message: "",
  payload: {},
  delay_seconds: 0,
});

export default function AutomationRulesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [sensorCache, setSensorCache] = useState({});
  const [expandedId, setExpandedId] = useState(null);

  // Dialog
  const dialog = useDialogState();
  const deleteDialog = useDialogState();
  const [form, setForm] = useState({
    name: "",
    description: "",
    trigger_type: "sensor_threshold",
    conditions: [emptyCondition()],
    actions: [emptyAction()],
    cooldown_seconds: 300,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Logs
  const [logsDialog, setLogsDialog] = useState({ open: false, logs: [], ruleName: "" });

  const fetchRules = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/rules");
      setRules(data.data || []);
    } catch {
      enqueueSnackbar("โหลดข้อมูลไม่สำเร็จ", { variant: "error" });
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    const devs = await SysGetDevices();
    setDevices(devs);
  }, []);

  useEffect(() => {
    Promise.all([fetchRules(), fetchDevices()]).then(() => setLoading(false));
  }, [fetchRules, fetchDevices]);

  const getSensorsForDevice = async (deviceId) => {
    if (sensorCache[deviceId]) return sensorCache[deviceId];
    const s = await SysGetDeviceSensorsById(deviceId);
    setSensorCache((prev) => ({ ...prev, [deviceId]: s || [] }));
    return s || [];
  };

  const openCreate = () => {
    setForm({
      name: "",
      description: "",
      trigger_type: "sensor_threshold",
      conditions: [emptyCondition()],
      actions: [emptyAction()],
      cooldown_seconds: 300,
      is_active: true,
    });
    dialog.open(null);
  };

  const openEdit = async (rule) => {
    setForm({
      name: rule.name,
      description: rule.description || "",
      trigger_type: rule.trigger_type,
      conditions: rule.conditions.map((c) => ({ ...c })),
      actions: rule.actions.map((a) => ({ ...a })),
      cooldown_seconds: rule.cooldown_seconds || 300,
      is_active: rule.is_active,
    });
    // Pre-load sensors for all conditions before opening dialog
    await Promise.all(
      rule.conditions
        .filter((c) => c.device_id)
        .map((c) => getSensorsForDevice(c.device_id))
    );
    dialog.open(rule);
  };

  const handleToggle = async (id) => {
    try {
      await apiClient.post(`/api/rules/${id}/toggle`);
      setRules((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, is_active: !r.is_active } : r
        )
      );
    } catch {
      enqueueSnackbar("เปลี่ยนสถานะไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar("กรุณากรอกชื่อกฎ", { variant: "warning" });
      return;
    }
    if (form.conditions.some((c) => !c.device_id || c.value === "")) {
      enqueueSnackbar("กรุณากรอกเงื่อนไขให้ครบ", { variant: "warning" });
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      conditions: form.conditions.map((c) => ({
        ...c,
        value: Number(c.value),
      })),
    };

    try {
      if (dialog.state.item) {
        await apiClient.put(`/api/rules/${dialog.state.item._id}`, payload);
        enqueueSnackbar("แก้ไขกฎสำเร็จ", { variant: "success" });
      } else {
        await apiClient.post("/api/rules", payload);
        enqueueSnackbar("สร้างกฎสำเร็จ", { variant: "success" });
      }
      dialog.close();
      fetchRules();
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/rules/${deleteDialog.state.item}`);
      enqueueSnackbar("ลบกฎแล้ว", { variant: "success" });
      deleteDialog.close();
      fetchRules();
    } catch {
      enqueueSnackbar("ลบไม่สำเร็จ", { variant: "error" });
    }
  };

  const openLogs = async (rule) => {
    try {
      const { data } = await apiClient.get(`/api/rules/${rule._id}/logs`);
      setLogsDialog({ open: true, logs: data.data || [], ruleName: rule.name });
    } catch {
      enqueueSnackbar("โหลด logs ไม่สำเร็จ", { variant: "error" });
    }
  };

  // Condition/Action helpers
  const updateCondition = (idx, field, value) => {
    setForm((f) => ({
      ...f,
      conditions: f.conditions.map((c, i) =>
        i === idx ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addCondition = () =>
    setForm((f) => ({
      ...f,
      conditions: [...f.conditions, emptyCondition()],
    }));

  const removeCondition = (idx) =>
    setForm((f) => ({
      ...f,
      conditions: f.conditions.filter((_, i) => i !== idx),
    }));

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

  const getDeviceName = (id) =>
    devices.find((d) => d.device_id === id)?.name || id;

  const getOperatorLabel = (op) =>
    OPERATORS.find((o) => o.value === op)?.label || op;

  if (loading) return <SkeletonCardGrid count={4} height={180} />;

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
            กฎอัตโนมัติ
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ตั้งกฎ if-then เช่น ถ้าอุณหภูมิ > 35 ให้ส่งแจ้งเตือน
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={openCreate}
          color="success"
        >
          สร้างกฎใหม่
        </Button>
      </Stack>

      {rules.length === 0 ? (
        <EmptyState
          icon={SmartToyIcon}
          title="ยังไม่มีกฎอัตโนมัติ"
          description="สร้างกฎเพื่อให้ระบบทำงานอัตโนมัติเมื่อค่าเซ็นเซอร์ถึงเงื่อนไข"
          action={
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={openCreate} color="success">
              สร้างกฎแรก
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {rules.map((rule) => (
            <Paper key={rule._id} variant="outlined">
              <Stack
                direction="row"
                alignItems="center"
                sx={{ px: 2.5, py: 1.5 }}
                spacing={2}
              >
                <Switch
                  checked={rule.is_active}
                  onChange={() => handleToggle(rule._id)}
                  size="small"
                />
                <Box
                  sx={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                  onClick={() =>
                    setExpandedId(expandedId === rule._id ? null : rule._id)
                  }
                >
                  <Typography variant="body1" fontWeight={600} noWrap>
                    {rule.name}
                  </Typography>
                  {rule.description && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {rule.description}
                    </Typography>
                  )}
                </Box>

                <Chip
                  label={`${rule.conditions?.length || 0} เงื่อนไข`}
                  size="small"
                  variant="outlined"
                  color="info"
                />
                <Chip
                  label={`${rule.actions?.length || 0} action`}
                  size="small"
                  variant="outlined"
                  color="warning"
                />

                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="ดู Logs">
                    <IconButton size="small" onClick={() => openLogs(rule)}>
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="แก้ไข">
                    <IconButton size="small" onClick={() => openEdit(rule)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() =>
                        deleteDialog.open(rule._id)
                      }
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={() =>
                      setExpandedId(
                        expandedId === rule._id ? null : rule._id
                      )
                    }
                  >
                    {expandedId === rule._id ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>
                </Stack>
              </Stack>

              <Collapse in={expandedId === rule._id}>
                <Divider />
                <Box sx={{ px: 2.5, py: 2 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    เงื่อนไข (IF)
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5, mb: 1.5 }}>
                    {rule.conditions?.map((c, i) => (
                      <Typography key={i} variant="body2">
                        {i > 0 && (
                          <Chip
                            label={c.logic}
                            size="small"
                            sx={{ mr: 1, height: 20, fontSize: "0.7rem" }}
                          />
                        )}
                        {getDeviceName(c.device_id)} / {c.sensor_id}{" "}
                        <strong>{getOperatorLabel(c.operator)}</strong>{" "}
                        {Array.isArray(c.value)
                          ? c.value.join(" - ")
                          : c.value}
                      </Typography>
                    ))}
                  </Stack>

                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    การกระทำ (THEN)
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {rule.actions?.map((a, i) => (
                      <Typography key={i} variant="body2">
                        {ACTION_TYPES.find((t) => t.value === a.type)?.label ||
                          a.type}
                        {a.message && `: "${a.message}"`}
                        {a.command && `: ${a.command}`}
                      </Typography>
                    ))}
                  </Stack>

                  {rule.last_triggered && (
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ mt: 1, display: "block" }}
                    >
                      ทำงานล่าสุด:{" "}
                      {new Date(rule.last_triggered).toLocaleString("th-TH")}
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialog.state.open}
        onClose={dialog.close}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {dialog.state.item ? "แก้ไขกฎ" : "สร้างกฎใหม่"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {/* Basic Info */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ชื่อกฎ"
                  fullWidth
                  size="small"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="คำอธิบาย"
                  fullWidth
                  size="small"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="คูลดาวน์ (วินาที)"
                  type="number"
                  fullWidth
                  size="small"
                  value={form.cooldown_seconds}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      cooldown_seconds: Number(e.target.value),
                    }))
                  }
                  helperText="ระยะเวลาขั้นต่ำระหว่างการทำงานซ้ำ"
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Conditions */}
            <Box>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  เงื่อนไข (IF)
                </Typography>
                <Button
                  size="small"
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={addCondition}
                >
                  เพิ่มเงื่อนไข
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {form.conditions.map((cond, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{ p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.03) }}
                  >
                    <Grid container spacing={1.5} alignItems="center">
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <TextField
                          label="อุปกรณ์"
                          select
                          fullWidth
                          size="small"
                          value={cond.device_id}
                          onChange={(e) => {
                            updateCondition(idx, "device_id", e.target.value);
                            updateCondition(idx, "sensor_id", "");
                            getSensorsForDevice(e.target.value);
                          }}
                        >
                          {devices.map((d) => (
                            <MenuItem key={d.device_id} value={d.device_id}>
                              {d.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField
                          label="เซ็นเซอร์"
                          select
                          fullWidth
                          size="small"
                          value={cond.sensor_id}
                          onChange={(e) =>
                            updateCondition(idx, "sensor_id", e.target.value)
                          }
                          disabled={!cond.device_id}
                        >
                          {(sensorCache[cond.device_id] || []).map((s) => (
                            <MenuItem key={s.sensor_id} value={s.sensor_id}>
                              {s.sensor_name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 3, sm: 2 }}>
                        <TextField
                          label="ตัวดำเนินการ"
                          select
                          fullWidth
                          size="small"
                          value={cond.operator}
                          onChange={(e) =>
                            updateCondition(idx, "operator", e.target.value)
                          }
                        >
                          {OPERATORS.map((o) => (
                            <MenuItem key={o.value} value={o.value}>
                              {o.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 3, sm: 2 }}>
                        <TextField
                          label="ค่า"
                          type="number"
                          fullWidth
                          size="small"
                          value={cond.value}
                          onChange={(e) =>
                            updateCondition(idx, "value", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 2 }}>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {idx > 0 && (
                            <TextField
                              select
                              size="small"
                              value={cond.logic}
                              onChange={(e) =>
                                updateCondition(idx, "logic", e.target.value)
                              }
                              sx={{ width: 80 }}
                            >
                              <MenuItem value="AND">AND</MenuItem>
                              <MenuItem value="OR">OR</MenuItem>
                            </TextField>
                          )}
                          {form.conditions.length > 1 && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeCondition(idx)}
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                ))}
              </Stack>
            </Box>

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
                  การกระทำ (THEN)
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
                      <Grid size={{ xs: 12, sm: 3 }}>
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
                          <Grid size={{ xs: 6, sm: 3 }}>
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
                              placeholder="เช่น turn_on, turn_off"
                            />
                          </Grid>
                        </>
                      )}
                      {(act.type === "send_notification" ||
                        act.type === "log_event") && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="ข้อความ"
                            fullWidth
                            size="small"
                            value={act.message}
                            onChange={(e) =>
                              updateAction(idx, "message", e.target.value)
                            }
                            placeholder="ข้อความแจ้งเตือน"
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
        onClose={() => setLogsDialog({ open: false, logs: [], ruleName: "" })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Logs: {logsDialog.ruleName}
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
                <Paper
                  key={log._id}
                  variant="outlined"
                  sx={{ p: 1.5 }}
                >
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
            onClick={() =>
              setLogsDialog({ open: false, logs: [], ruleName: "" })
            }
          >
            ปิด
          </Button>
        </DialogActions>
      </Dialog>

      <DialogConfirm
        open={deleteDialog.state.open}
        title="ลบกฎอัตโนมัติ?"
        content="ต้องการลบกฎนี้หรือไม่? การลบจะไม่สามารถกู้คืนได้"
        handleClose={deleteDialog.close}
        handleConfirm={handleDelete}
      />
    </Box>
  );
}
