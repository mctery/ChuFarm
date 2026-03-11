import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Box,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
import BulkActionBar from "../../components/admin/BulkActionBar";
import apiClient from "../../services/apiClient";
import DialogConfirm from "../../components/DialogConfirm";

const SENSOR_TYPES = ["temperature", "humidity", "light", "soil"];

const TYPE_COLORS = {
  temperature: "error",
  humidity: "info",
  light: "warning",
  soil: "success",
};

const COLUMNS = [
  { id: "select", label: "", width: 40 },
  { id: "sensor_name", label: "ชื่อเซ็นเซอร์" },
  { id: "sensor_type", label: "ประเภท", align: "center" },
  { id: "device_name", label: "อุปกรณ์" },
  { id: "unit", label: "หน่วย", align: "center" },
  { id: "range", label: "ช่วงค่า", align: "center" },
  { id: "actions", label: "", align: "center", width: 100 },
];

const CSV_COLUMNS = [
  { key: "sensor_name", label: "ชื่อเซ็นเซอร์" },
  { key: "sensor_type", label: "ประเภท" },
  { key: "device_name", label: "อุปกรณ์" },
  { key: "device_id", label: "รหัสอุปกรณ์" },
  { key: "unit", label: "หน่วย" },
  { key: "min", label: "ค่าต่ำสุด" },
  { key: "max", label: "ค่าสูงสุด" },
];

const EMPTY_CREATE = { device: null, sensor_id: "", sensor_type: "", sensor_name: "", unit: "", min: "", max: "", bgcolor: "#2196f3" };

export default function AdminSensorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [sensors, setSensors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [creating, setCreating] = useState(false);

  const editDialog = useDialogState();
  const deleteDialog = useDialogState();
  const bulkDeleteDialog = useDialogState();
  const [editForm, setEditForm] = useState({ sensor_name: "", unit: "", min: "", max: "", bgcolor: "#2196f3" });

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (typeFilter) params.sensor_type = typeFilter;
      const { data } = await apiClient.get("/api/admin/sensors", { params });
      setSensors(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
      setSelected([]);
    } catch {
      enqueueSnackbar("โหลดข้อมูลเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, enqueueSnackbar]);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

  // Load devices when create dialog opens
  useEffect(() => {
    if (!createOpen) return;
    apiClient.get("/api/admin/devices", { params: { limit: 200 } })
      .then(({ data }) => setDeviceOptions(data.data || []))
      .catch(() => setDeviceOptions([]));
  }, [createOpen]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const openEdit = (sensor) => {
    setEditForm({
      sensor_name: sensor.sensor_name || "",
      unit: sensor.unit || "",
      min: sensor.min ?? "",
      max: sensor.max ?? "",
      bgcolor: sensor.bgcolor || "#2196f3",
    });
    editDialog.open(sensor);
  };

  const handleCreate = async () => {
    if (!createForm.device || !createForm.sensor_type || !createForm.sensor_id) {
      enqueueSnackbar("กรุณากรอกข้อมูลที่จำเป็น", { variant: "warning" });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        device_id: createForm.device._id,
        sensor_id: createForm.sensor_id,
        sensor_type: createForm.sensor_type,
        sensor_name: createForm.sensor_name || undefined,
        unit: createForm.unit || undefined,
        min: createForm.min !== "" ? Number(createForm.min) : undefined,
        max: createForm.max !== "" ? Number(createForm.max) : undefined,
        bgcolor: createForm.bgcolor || undefined,
      };
      await apiClient.post("/api/sensors", payload);
      enqueueSnackbar("เพิ่มเซ็นเซอร์สำเร็จ", { variant: "success" });
      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE);
      fetchSensors();
    } catch {
      enqueueSnackbar("เพิ่มเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const payload = { ...editForm };
      if (payload.min !== "") payload.min = Number(payload.min);
      else payload.min = null;
      if (payload.max !== "") payload.max = Number(payload.max);
      else payload.max = null;
      if (!payload.bgcolor) delete payload.bgcolor;
      await apiClient.put(`/api/admin/sensors/${editDialog.state.item._id}`, payload);
      enqueueSnackbar("แก้ไขเซ็นเซอร์สำเร็จ", { variant: "success" });
      editDialog.close();
      fetchSensors();
    } catch {
      enqueueSnackbar("แก้ไขเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await apiClient.delete(`/api/admin/sensors/${deleteDialog.state.item}`);
      enqueueSnackbar("ลบเซ็นเซอร์สำเร็จ", { variant: "success" });
      deleteDialog.close();
      fetchSensors();
    } catch {
      enqueueSnackbar("ลบเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await apiClient.delete("/api/admin/sensors/bulk-delete", { data: { ids: selected } });
      enqueueSnackbar(`ลบ ${selected.length} เซ็นเซอร์สำเร็จ`, { variant: "success" });
      bulkDeleteDialog.close();
      fetchSensors();
    } catch {
      enqueueSnackbar("ลบเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelected((prev) => prev.length === sensors.length ? [] : sensors.map((s) => s._id));

  return (
    <AdminPageWrapper
      title="จัดการเซ็นเซอร์"
      action={
        <Stack direction="row" spacing={1}>
          <ExportButton data={sensors} columns={CSV_COLUMNS} filename="admin-sensors" />
          <Button variant="contained" size="small" startIcon={<AddCircleIcon />} onClick={() => setCreateOpen(true)}>
            เพิ่มเซ็นเซอร์
          </Button>
        </Stack>
      }
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <AdminSearchBar placeholder="ค้นหาชื่อเซ็นเซอร์..." onSearch={handleSearch} />
        <AdminFilterBar
          filters={[
            {
              label: "ประเภท",
              value: typeFilter,
              onChange: (v) => {
                setTypeFilter(v);
                setPagination((prev) => ({ ...prev, page: 1 }));
              },
              options: SENSOR_TYPES.map((t) => ({ value: t, label: t })),
            },
          ]}
        />
        {selected.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              เลือก {selected.length} รายการ
            </Typography>
            <Chip
              label="ลบที่เลือก"
              color="error"
              size="small"
              onClick={bulkDeleteDialog.open}
              onDelete={bulkDeleteDialog.open}
              deleteIcon={<DeleteIcon />}
            />
          </Stack>
        )}
      </Stack>

      <AdminDataTable
        columns={COLUMNS}
        rows={sensors}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบเซ็นเซอร์"
        renderRow={(sensor) => {
          const isSelected = selected.includes(sensor._id);
          return (
            <TableRow key={sensor._id} hover selected={isSelected} onClick={() => toggleSelect(sensor._id)} sx={{ cursor: "pointer" }}>
              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  size="small"
                  checked={isSelected}
                  onChange={() => toggleSelect(sensor._id)}
                />
              </TableCell>
              <TableCell>{sensor.sensor_name || "—"}</TableCell>
              <TableCell align="center">
                <Chip
                  label={sensor.sensor_type}
                  color={TYPE_COLORS[sensor.sensor_type] || "default"}
                  size="small"
                />
              </TableCell>
              <TableCell>{sensor.device_name || "—"}</TableCell>
              <TableCell align="center">{sensor.unit || "—"}</TableCell>
              <TableCell align="center">
                {sensor.min != null || sensor.max != null
                  ? `${sensor.min ?? "—"} ~ ${sensor.max ?? "—"}`
                  : "—"}
              </TableCell>
              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                <IconButton size="small" color="primary" onClick={() => openEdit(sensor)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => deleteDialog.open(sensor._id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        }}
      />

      {/* Create Sensor Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>เพิ่มเซ็นเซอร์</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Autocomplete
              options={deviceOptions}
              getOptionLabel={(o) => `${o.name} (${o.device_id})`}
              value={createForm.device}
              onChange={(_, val) => setCreateForm((f) => ({ ...f, device: val }))}
              renderInput={(params) => <TextField {...params} label="อุปกรณ์" size="small" required />}
              size="small"
            />
            <TextField
              label="รหัสเซ็นเซอร์"
              size="small"
              value={createForm.sensor_id}
              onChange={(e) => setCreateForm((f) => ({ ...f, sensor_id: e.target.value }))}
              fullWidth
              required
              placeholder="เช่น sensor_01"
            />
            <FormControl size="small" fullWidth required>
              <InputLabel>ประเภทเซ็นเซอร์</InputLabel>
              <Select
                value={createForm.sensor_type}
                label="ประเภทเซ็นเซอร์"
                onChange={(e) => setCreateForm((f) => ({ ...f, sensor_type: e.target.value }))}
              >
                {SENSOR_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="ชื่อเซ็นเซอร์"
              size="small"
              value={createForm.sensor_name}
              onChange={(e) => setCreateForm((f) => ({ ...f, sensor_name: e.target.value }))}
              fullWidth
              placeholder="เช่น อุณหภูมิโรงเรือน 1"
            />
            <TextField
              label="หน่วย"
              size="small"
              value={createForm.unit}
              onChange={(e) => setCreateForm((f) => ({ ...f, unit: e.target.value }))}
              fullWidth
              placeholder="เช่น °C, %, lux"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="ค่าต่ำสุด"
                size="small"
                type="number"
                value={createForm.min}
                onChange={(e) => setCreateForm((f) => ({ ...f, min: e.target.value }))}
                fullWidth
              />
              <TextField
                label="ค่าสูงสุด"
                size="small"
                type="number"
                value={createForm.max}
                onChange={(e) => setCreateForm((f) => ({ ...f, max: e.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="สีพื้นหลัง Widget"
                type="color"
                size="small"
                value={createForm.bgcolor}
                onChange={(e) => setCreateForm((f) => ({ ...f, bgcolor: e.target.value }))}
                sx={{ width: 120 }}
              />
              <TextField
                label="รหัสสี (Hex)"
                size="small"
                fullWidth
                value={createForm.bgcolor}
                onChange={(e) => setCreateForm((f) => ({ ...f, bgcolor: e.target.value }))}
                placeholder="#2196f3"
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: createForm.bgcolor, mr: 1, border: "1px solid", borderColor: "divider", flexShrink: 0 }} />
                    ),
                  },
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={creating}>ยกเลิก</Button>
          <Button variant="contained" color="success" onClick={handleCreate} disabled={creating}>
            {creating ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.state.open} onClose={editDialog.close} maxWidth="sm" fullWidth>
        <DialogTitle>แก้ไขเซ็นเซอร์</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="ชื่อเซ็นเซอร์"
              value={editForm.sensor_name}
              onChange={(e) => setEditForm((f) => ({ ...f, sensor_name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="หน่วย"
              value={editForm.unit}
              onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="ค่าต่ำสุด"
                type="number"
                value={editForm.min}
                onChange={(e) => setEditForm((f) => ({ ...f, min: e.target.value }))}
                fullWidth
              />
              <TextField
                label="ค่าสูงสุด"
                type="number"
                value={editForm.max}
                onChange={(e) => setEditForm((f) => ({ ...f, max: e.target.value }))}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="สีพื้นหลัง Widget"
                type="color"
                size="small"
                value={editForm.bgcolor}
                onChange={(e) => setEditForm((f) => ({ ...f, bgcolor: e.target.value }))}
                sx={{ width: 120 }}
              />
              <TextField
                label="รหัสสี (Hex)"
                size="small"
                fullWidth
                value={editForm.bgcolor}
                onChange={(e) => setEditForm((f) => ({ ...f, bgcolor: e.target.value }))}
                placeholder="#2196f3"
                slotProps={{
                  input: {
                    startAdornment: (
                      <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: editForm.bgcolor, mr: 1, border: "1px solid", borderColor: "divider", flexShrink: 0 }} />
                    ),
                  },
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={editDialog.close}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveEdit}>บันทึก</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <DialogConfirm
        open={deleteDialog.state.open}
        handleClose={deleteDialog.close}
        handleConfirm={handleConfirmDelete}
        title="ลบเซ็นเซอร์"
        content="ยืนยันลบเซ็นเซอร์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        confirmColor="error"
      />

      {/* Bulk Delete Confirm */}
      <DialogConfirm
        open={bulkDeleteDialog.state.open}
        handleClose={bulkDeleteDialog.close}
        handleConfirm={handleBulkDelete}
        title="ลบเซ็นเซอร์ที่เลือก"
        content={`ยืนยันลบ ${selected.length} เซ็นเซอร์? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบทั้งหมด"
        confirmColor="error"
      />
    </AdminPageWrapper>
  );
}
