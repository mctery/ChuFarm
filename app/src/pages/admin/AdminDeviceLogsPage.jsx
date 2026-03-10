import { useState, useEffect, useCallback } from "react";
import { TableRow, TableCell, Chip, Stack } from "@mui/material";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
import apiClient from "../../services/apiClient";
import { formatDate } from "../../utils/dateFormat";

const EVENT_COLORS = {
  online: "success",
  offline: "error",
  command_sent: "info",
  command_ack: "primary",
};

const EVENTS = ["online", "offline", "command_sent", "command_ack"];

const COLUMNS = [
  { id: "createdAt", label: "วันที่" },
  { id: "device_name", label: "อุปกรณ์" },
  { id: "device_id", label: "Device ID" },
  { id: "event", label: "เหตุการณ์", align: "center" },
  { id: "metadata", label: "ข้อมูลเพิ่มเติม" },
];

const CSV_COLUMNS = [
  { key: "createdAt", label: "วันที่" },
  { key: "device_name", label: "อุปกรณ์" },
  { key: "device_id", label: "Device ID" },
  { key: "event", label: "เหตุการณ์" },
];

export default function AdminDeviceLogsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [eventFilter, setEventFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (eventFilter) params.event = eventFilter;
      const { data } = await apiClient.get("/api/admin/device-logs", { params });
      setLogs(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch {
      enqueueSnackbar("โหลดข้อมูล Device Logs ไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, eventFilter, enqueueSnackbar]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const csvData = logs.map((l) => ({
    ...l,
    createdAt: formatDate(l.createdAt),
  }));

  return (
    <AdminPageWrapper
      title="ล็อกอุปกรณ์"
      action={<ExportButton data={csvData} columns={CSV_COLUMNS} filename="admin-device-logs" />}
    >
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <AdminFilterBar
          filters={[
            {
              label: "เหตุการณ์",
              value: eventFilter,
              onChange: (v) => {
                setEventFilter(v);
                setPagination((prev) => ({ ...prev, page: 1 }));
              },
              options: EVENTS.map((e) => ({ value: e, label: e })),
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
        emptyText="ไม่พบ Device Logs"
        renderRow={(log) => (
          <TableRow key={log._id} hover>
            <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.createdAt)}</TableCell>
            <TableCell>{log.device_name}</TableCell>
            <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>{log.device_id}</TableCell>
            <TableCell align="center">
              <Chip
                label={log.event}
                color={EVENT_COLORS[log.event] || "default"}
                size="small"
              />
            </TableCell>
            <TableCell sx={{ fontSize: 12 }}>
              {log.metadata && Object.keys(log.metadata).length > 0
                ? JSON.stringify(log.metadata)
                : "—"}
            </TableCell>
          </TableRow>
        )}
      />
    </AdminPageWrapper>
  );
}
