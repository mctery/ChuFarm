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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
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
  { key: "device_id", label: "Device ID" },
  { key: "unit", label: "หน่วย" },
  { key: "min", label: "ค่าต่ำสุด" },
  { key: "max", label: "ค่าสูงสุด" },
];

export default function AdminSensorsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [sensors, setSensors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const editDialog = useDialogState();
  const deleteDialog = useDialogState();
  const [editForm, setEditForm] = useState({ sensor_name: "", unit: "", min: "", max: "" });

  const fetchSensors = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (typeFilter) params.sensor_type = typeFilter;
      const { data } = await apiClient.get("/api/admin/sensors", { params });
      setSensors(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch {
      enqueueSnackbar("โหลดข้อมูลเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, enqueueSnackbar]);

  useEffect(() => { fetchSensors(); }, [fetchSensors]);

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
    });
    editDialog.open(sensor);
  };

  const handleSaveEdit = async () => {
    try {
      const payload = { ...editForm };
      if (payload.min !== "") payload.min = Number(payload.min);
      else payload.min = null;
      if (payload.max !== "") payload.max = Number(payload.max);
      else payload.max = null;
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
      fetchSensors();
    } catch {
      enqueueSnackbar("ลบเซ็นเซอร์ไม่สำเร็จ", { variant: "error" });
    }
  };

  return (
    <AdminPageWrapper
      title="จัดการเซ็นเซอร์"
      action={<ExportButton data={sensors} columns={CSV_COLUMNS} filename="admin-sensors" />}
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
      </Stack>

      <AdminDataTable
        columns={COLUMNS}
        rows={sensors}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบเซ็นเซอร์"
        renderRow={(sensor) => (
          <TableRow key={sensor._id} hover>
            <TableCell>{sensor.sensor_name || "—"}</TableCell>
            <TableCell align="center">
              <Chip
                label={sensor.sensor_type}
                color={TYPE_COLORS[sensor.sensor_type] || "default"}
                size="small"
              />
            </TableCell>
            <TableCell>{sensor.device_name}</TableCell>
            <TableCell align="center">{sensor.unit || "—"}</TableCell>
            <TableCell align="center">
              {sensor.min != null || sensor.max != null
                ? `${sensor.min ?? "—"} ~ ${sensor.max ?? "—"}`
                : "—"}
            </TableCell>
            <TableCell align="center">
              <IconButton size="small" onClick={() => openEdit(sensor)} title="แก้ไข">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => deleteDialog.open(sensor._id)} title="ลบ">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )}
      />

      <DialogConfirm
        open={deleteDialog.state.open}
        handleClose={deleteDialog.close}
        handleConfirm={handleConfirmDelete}
        title="ลบเซ็นเซอร์"
        content="ยืนยันลบเซ็นเซอร์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        confirmColor="error"
      />

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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={editDialog.close}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveEdit}>บันทึก</Button>
        </DialogActions>
      </Dialog>
    </AdminPageWrapper>
  );
}
