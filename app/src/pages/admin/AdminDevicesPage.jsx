import { useState, useEffect, useCallback } from "react";
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

const COLUMNS = [
  { id: "name", label: "ชื่ออุปกรณ์" },
  { id: "device_id", label: "Device ID" },
  { id: "owner", label: "เจ้าของ" },
  { id: "online_status", label: "สถานะ", align: "center" },
  { id: "last_seen", label: "เชื่อมต่อล่าสุด" },
  { id: "actions", label: "", align: "center", width: 100 },
];

const CSV_COLUMNS = [
  { key: "name", label: "ชื่ออุปกรณ์" },
  { key: "device_id", label: "Device ID" },
  { key: "owner_name", label: "เจ้าของ" },
  { key: "online_status", label: "สถานะ" },
  { key: "last_seen", label: "เชื่อมต่อล่าสุด" },
];

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminDevicesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [devices, setDevices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [onlineFilter, setOnlineFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit dialog
  const [editDialog, setEditDialog] = useState({ open: false, device: null });
  const [editForm, setEditForm] = useState({ name: "", version: "" });

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (onlineFilter) params.online_status = onlineFilter;
      const { data } = await apiClient.get("/api/admin/devices", { params });
      setDevices(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch {
      enqueueSnackbar("โหลดข้อมูลอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, onlineFilter, enqueueSnackbar]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const openEdit = (device) => {
    setEditForm({ name: device.name, version: device.version || "" });
    setEditDialog({ open: true, device });
  };

  const handleSaveEdit = async () => {
    try {
      await apiClient.put(`/api/admin/devices/${editDialog.device._id}`, editForm);
      enqueueSnackbar("แก้ไขอุปกรณ์สำเร็จ", { variant: "success" });
      setEditDialog({ open: false, device: null });
      fetchDevices();
    } catch {
      enqueueSnackbar("แก้ไขอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันลบอุปกรณ์นี้?")) return;
    try {
      await apiClient.delete(`/api/admin/devices/${id}`);
      enqueueSnackbar("ลบอุปกรณ์สำเร็จ", { variant: "success" });
      fetchDevices();
    } catch {
      enqueueSnackbar("ลบอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const csvData = devices.map((d) => ({
    ...d,
    owner_name: d.owner ? `${d.owner.first_name} ${d.owner.last_name}` : "—",
    online_status: d.online_status ? "Online" : "Offline",
    last_seen: formatDate(d.last_seen),
  }));

  return (
    <AdminPageWrapper
      title="จัดการอุปกรณ์"
      action={<ExportButton data={csvData} columns={CSV_COLUMNS} filename="admin-devices" />}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <AdminSearchBar placeholder="ค้นหาชื่อ, Device ID..." onSearch={handleSearch} />
        <AdminFilterBar
          filters={[
            {
              label: "สถานะ",
              value: onlineFilter,
              onChange: (v) => {
                setOnlineFilter(v);
                setPagination((prev) => ({ ...prev, page: 1 }));
              },
              options: [
                { value: "true", label: "Online" },
                { value: "false", label: "Offline" },
              ],
            },
          ]}
        />
      </Stack>

      <AdminDataTable
        columns={COLUMNS}
        rows={devices}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบอุปกรณ์"
        renderRow={(device) => (
          <TableRow key={device._id} hover>
            <TableCell>{device.name}</TableCell>
            <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{device.device_id}</TableCell>
            <TableCell>
              {device.owner ? `${device.owner.first_name} ${device.owner.last_name}` : "—"}
            </TableCell>
            <TableCell align="center">
              <Chip
                label={device.online_status ? "Online" : "Offline"}
                color={device.online_status ? "success" : "default"}
                size="small"
              />
            </TableCell>
            <TableCell>{formatDate(device.last_seen)}</TableCell>
            <TableCell align="center">
              <IconButton size="small" onClick={() => openEdit(device)} title="แก้ไข">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => handleDelete(device._id)} title="ลบ">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, device: null })} maxWidth="sm" fullWidth>
        <DialogTitle>แก้ไขอุปกรณ์</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="ชื่ออุปกรณ์"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="เวอร์ชัน"
              value={editForm.version}
              onChange={(e) => setEditForm((f) => ({ ...f, version: e.target.value }))}
              fullWidth
            />
            <TextField label="Device ID" value={editDialog.device?.device_id || ""} disabled fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, device: null })}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSaveEdit}>บันทึก</Button>
        </DialogActions>
      </Dialog>
    </AdminPageWrapper>
  );
}
