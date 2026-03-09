import { useState, useEffect, useCallback } from "react";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
import apiClient from "../../services/apiClient";

const TYPES = ["threshold_alert", "device_offline", "device_online", "system"];
const SEVERITIES = ["info", "warning", "critical"];

const SEVERITY_COLORS = { info: "info", warning: "warning", critical: "error" };
const TYPE_LABELS = {
  threshold_alert: "Threshold",
  device_offline: "Offline",
  device_online: "Online",
  system: "System",
};

const COLUMNS = [
  { id: "createdAt", label: "วันที่" },
  { id: "user_name", label: "ผู้ใช้" },
  { id: "title", label: "หัวข้อ" },
  { id: "type", label: "ประเภท", align: "center" },
  { id: "severity", label: "ความรุนแรง", align: "center" },
  { id: "is_read", label: "อ่านแล้ว", align: "center" },
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

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminNotificationsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [loading, setLoading] = useState(false);

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
      </Stack>

      <AdminDataTable
        columns={COLUMNS}
        rows={notifications}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบแจ้งเตือน"
        renderRow={(n) => (
          <TableRow key={n._id} hover>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(n.createdAt)}</TableCell>
            <TableCell>{n.user_name}</TableCell>
            <TableCell>{n.title}</TableCell>
            <TableCell align="center">
              <Chip label={TYPE_LABELS[n.type] || n.type} variant="outlined" size="small" />
            </TableCell>
            <TableCell align="center">
              <Chip
                label={n.severity}
                color={SEVERITY_COLORS[n.severity] || "default"}
                size="small"
              />
            </TableCell>
            <TableCell align="center">
              <Chip
                label={n.is_read ? "อ่านแล้ว" : "ยังไม่อ่าน"}
                color={n.is_read ? "default" : "warning"}
                size="small"
                variant={n.is_read ? "outlined" : "filled"}
              />
            </TableCell>
          </TableRow>
        )}
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
