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
  Typography,
  Stack,
  Box,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
import apiClient from "../../services/apiClient";
import { formatDate } from "../../utils/dateFormat";

const ACTION_COLORS = {
  create: "success",
  update: "info",
  delete: "error",
  login: "primary",
  logout: "default",
};

const RESOURCE_TYPES = ["device", "sensor", "user", "sensor_widget", "threshold", "setting"];
const ACTIONS = ["create", "update", "delete", "login", "logout"];

const COLUMNS = [
  { id: "createdAt", label: "วันที่" },
  { id: "user_id", label: "ผู้ใช้" },
  { id: "action", label: "การกระทำ", align: "center" },
  { id: "resource_type", label: "ประเภท", align: "center" },
  { id: "resource_id", label: "รหัสทรัพยากร" },
  { id: "ip_address", label: "ไอพี" },
  { id: "detail", label: "", align: "center", width: 50 },
];

const CSV_COLUMNS = [
  { key: "createdAt", label: "วันที่" },
  { key: "user_id", label: "ผู้ใช้" },
  { key: "action", label: "การกระทำ" },
  { key: "resource_type", label: "ประเภท" },
  { key: "resource_id", label: "รหัสทรัพยากร" },
  { key: "ip_address", label: "ไอพี" },
];

export default function AdminAuditLogsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [resourceType, setResourceType] = useState("");
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState({ open: false, log: null });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (resourceType) params.resource_type = resourceType;
      if (action) params.action = action;
      const { data } = await apiClient.get("/api/audit-logs", { params });
      setLogs(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination?.total || 0 }));
    } catch {
      enqueueSnackbar("โหลดข้อมูล Audit Logs ไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, resourceType, action, enqueueSnackbar]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const csvData = logs.map((l) => ({
    ...l,
    createdAt: formatDate(l.createdAt),
  }));

  return (
    <AdminPageWrapper
      title="ล็อกการตรวจสอบ"
      action={<ExportButton data={csvData} columns={CSV_COLUMNS} filename="admin-audit-logs" />}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <AdminFilterBar
          filters={[
            {
              label: "ประเภททรัพยากร",
              value: resourceType,
              onChange: (v) => {
                setResourceType(v);
                setPagination((prev) => ({ ...prev, page: 1 }));
              },
              options: RESOURCE_TYPES.map((t) => ({ value: t, label: t })),
            },
            {
              label: "การกระทำ",
              value: action,
              onChange: (v) => {
                setAction(v);
                setPagination((prev) => ({ ...prev, page: 1 }));
              },
              options: ACTIONS.map((a) => ({ value: a, label: a })),
            },
          ]}
        />
      </Stack>

      <AdminDataTable
        columns={COLUMNS}
        rows={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบ Audit Logs"
        renderRow={(log) => (
          <TableRow key={log._id} hover>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.createdAt)}</TableCell>
            <TableCell>{log.user_id}</TableCell>
            <TableCell align="center">
              <Chip
                label={log.action}
                color={ACTION_COLORS[log.action] || "default"}
                size="small"
              />
            </TableCell>
            <TableCell align="center">
              <Chip label={log.resource_type} variant="outlined" size="small" />
            </TableCell>
            <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
              {log.resource_id || "—"}
            </TableCell>
            <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
              {log.ip_address || "—"}
            </TableCell>
            <TableCell align="center">
              <IconButton
                size="small"
                onClick={() => setDetailDialog({ open: true, log })}
                title="ดูรายละเอียด"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Detail Dialog */}
      <Dialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, log: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>รายละเอียด Audit Log</DialogTitle>
        <DialogContent dividers>
          {detailDialog.log && (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>วันที่:</strong> {formatDate(detailDialog.log.createdAt)}
              </Typography>
              <Typography variant="body2">
                <strong>ผู้ใช้:</strong> {detailDialog.log.user_id}
              </Typography>
              <Typography variant="body2">
                <strong>การกระทำ:</strong> {detailDialog.log.action}
              </Typography>
              <Typography variant="body2">
                <strong>ประเภท:</strong> {detailDialog.log.resource_type}
              </Typography>
              <Typography variant="body2">
                <strong>Resource ID:</strong> {detailDialog.log.resource_id || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>IP:</strong> {detailDialog.log.ip_address || "—"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Changes:</strong>
              </Typography>
              <Box
                component="pre"
                sx={{
                  bgcolor: "grey.100",
                  p: 2,
                  borderRadius: 1,
                  fontSize: 12,
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                {JSON.stringify(detailDialog.log.changes, null, 2)}
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog({ open: false, log: null })}>ปิด</Button>
        </DialogActions>
      </Dialog>
    </AdminPageWrapper>
  );
}
