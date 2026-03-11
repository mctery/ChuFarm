import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
import {
  TableRow,
  TableCell,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Checkbox,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
import DialogConfirm from "../../components/DialogConfirm";
import apiClient from "../../services/apiClient";
import { formatDate } from "../../utils/dateFormat";

const TYPES = ["threshold_alert", "device_offline", "device_online", "system"];
const SEVERITIES = ["info", "warning", "critical"];

const SEVERITY_COLORS = { info: "info", warning: "warning", critical: "error" };
const TYPE_LABELS = {
  threshold_alert: "เกณฑ์แจ้งเตือน",
  device_offline: "อุปกรณ์ออฟไลน์",
  device_online: "อุปกรณ์ออนไลน์",
  system: "ระบบ",
};

const COLUMNS = [
  { id: "select", label: "", width: 40 },
  { id: "createdAt", label: "วันที่" },
  { id: "user_name", label: "ผู้ใช้" },
  { id: "title", label: "หัวข้อ" },
  { id: "type", label: "ประเภท", align: "center" },
  { id: "severity", label: "ความรุนแรง", align: "center" },
  { id: "is_read", label: "อ่านแล้ว", align: "center" },
  { id: "actions", label: "", align: "center", width: 60 },
];

const CSV_COLUMNS = [
  { key: "createdAt", label: "วันที่" },
  { key: "user_name", label: "ผู้ใช้" },
  { key: "title", label: "หัวข้อ" },
  { key: "message", label: "ข้อความ" },
  { key: "type", label: "ประเภท" },
  { key: "severity", label: "ความรุนแรง" },
  { key: "is_read", label: "อ่านแล้ว" },
];

export default function AdminNotificationsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState([]);
  const deleteDialog = useDialogState();
  const bulkDeleteDialog = useDialogState();

  const [createDialog, setCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", message: "", severity: "info" });
  const [creating, setCreating] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      if (severityFilter) params.severity = severityFilter;
      const { data } = await apiClient.get("/api/admin/notifications", { params });
      setNotifications(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
      setSelected([]);
    } catch {
      enqueueSnackbar("โหลดข้อมูลแจ้งเตือนไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, typeFilter, severityFilter, enqueueSnackbar]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/api/admin/notifications/${deleteDialog.state.item}`);
      enqueueSnackbar("ลบแจ้งเตือนสำเร็จ", { variant: "success" });
      deleteDialog.close();
      fetchNotifications();
    } catch {
      enqueueSnackbar("ลบแจ้งเตือนไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await apiClient.delete("/api/admin/notifications/bulk-delete", { data: { ids: selected } });
      enqueueSnackbar(`ลบ ${selected.length} แจ้งเตือนสำเร็จ`, { variant: "success" });
      bulkDeleteDialog.close();
      fetchNotifications();
    } catch {
      enqueueSnackbar("ลบแจ้งเตือนไม่สำเร็จ", { variant: "error" });
    }
  };

  const toggleSelect = (id) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await apiClient.post("/api/admin/notifications", createForm);
      enqueueSnackbar(`ส่งแจ้งเตือนถึง ${data.data.sent} คนสำเร็จ`, { variant: "success" });
      setCreateDialog(false);
      setCreateForm({ title: "", message: "", severity: "info" });
      fetchNotifications();
    } catch {
      enqueueSnackbar("สร้างแจ้งเตือนไม่สำเร็จ", { variant: "error" });
    } finally {
      setCreating(false);
    }
  };

  const csvData = notifications.map((n) => ({
    ...n,
    createdAt: formatDate(n.createdAt),
    is_read: n.is_read ? "ใช่" : "ไม่",
  }));

  return (
    <AdminPageWrapper
      title="การแจ้งเตือน"
      action={
        <Stack direction="row" spacing={1}>
          <ExportButton data={csvData} columns={CSV_COLUMNS} filename="admin-notifications" />
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setCreateDialog(true)}>
            สร้างแจ้งเตือน
          </Button>
        </Stack>
      }
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <AdminSearchBar placeholder="ค้นหาหัวข้อ, ข้อความ..." onSearch={handleSearch} />
        <AdminFilterBar
          filters={[
            {
              label: "ประเภท",
              value: typeFilter,
              onChange: (v) => { setTypeFilter(v); setPagination((p) => ({ ...p, page: 1 })); },
              options: TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] || t })),
            },
            {
              label: "ความรุนแรง",
              value: severityFilter,
              onChange: (v) => { setSeverityFilter(v); setPagination((p) => ({ ...p, page: 1 })); },
              options: SEVERITIES.map((s) => ({ value: s, label: s })),
            },
          ]}
        />
        {selected.length > 0 && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">เลือก {selected.length} รายการ</Typography>
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
        rows={notifications}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบแจ้งเตือน"
        renderRow={(n) => {
          const isSelected = selected.includes(n._id);
          return (
            <TableRow key={n._id} hover selected={isSelected} onClick={() => toggleSelect(n._id)} sx={{ cursor: "pointer" }}>
              <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                <Checkbox size="small" checked={isSelected} onChange={() => toggleSelect(n._id)} />
              </TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(n.createdAt)}</TableCell>
              <TableCell>{n.user_name}</TableCell>
              <TableCell>{n.title}</TableCell>
              <TableCell align="center">
                <Chip label={TYPE_LABELS[n.type] || n.type} variant="outlined" size="small" />
              </TableCell>
              <TableCell align="center">
                <Chip label={n.severity} color={SEVERITY_COLORS[n.severity] || "default"} size="small" />
              </TableCell>
              <TableCell align="center">
                <Chip
                  label={n.is_read ? "อ่านแล้ว" : "ยังไม่อ่าน"}
                  color={n.is_read ? "default" : "warning"}
                  size="small"
                  variant={n.is_read ? "outlined" : "filled"}
                />
              </TableCell>
              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                <Tooltip title="ลบ">
                  <IconButton size="small" color="error" onClick={() => deleteDialog.open(n._id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        }}
      />

      {/* Delete Confirm */}
      <DialogConfirm
        open={deleteDialog.state.open}
        handleClose={deleteDialog.close}
        handleConfirm={handleDelete}
        title="ลบแจ้งเตือน"
        content="ยืนยันลบแจ้งเตือนนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        confirmColor="error"
      />

      {/* Bulk Delete Confirm */}
      <DialogConfirm
        open={bulkDeleteDialog.state.open}
        handleClose={bulkDeleteDialog.close}
        handleConfirm={handleBulkDelete}
        title="ลบแจ้งเตือนที่เลือก"
        content={`ยืนยันลบ ${selected.length} แจ้งเตือน? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบทั้งหมด"
        confirmColor="error"
      />

      {/* Create Notification Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>สร้างแจ้งเตือนระบบ</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="หัวข้อ"
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
            />
            <TextField
              label="ข้อความ"
              value={createForm.message}
              onChange={(e) => setCreateForm((f) => ({ ...f, message: e.target.value }))}
              fullWidth
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>ความรุนแรง</InputLabel>
              <Select
                label="ความรุนแรง"
                value={createForm.severity}
                onChange={(e) => setCreateForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {SEVERITIES.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>ยกเลิก</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={creating || !createForm.title || !createForm.message}
          >
            ส่งถึงผู้ใช้ทั้งหมด
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageWrapper>
  );
}
