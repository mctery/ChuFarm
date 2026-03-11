import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
import {
  TableRow,
  TableCell,
  Chip,
  IconButton,
  Stack,
  Avatar,
  Box,
  Typography,
  Tooltip,
  alpha,
  useTheme,
  LinearProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DevicesIcon from "@mui/icons-material/Devices";
import BatteryAlertIcon from "@mui/icons-material/BatteryAlert";
import CircleIcon from "@mui/icons-material/Circle";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import { useSnackbar } from "notistack";
import { Button } from "@mui/material";
import { getUserInfo } from "../../services/storage_service";

import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminDataTable from "../../components/admin/AdminDataTable";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import AdminFilterBar from "../../components/admin/AdminFilterBar";
import ExportButton from "../../components/admin/ExportButton";
import DialogConfirm from "../../components/DialogConfirm";
import DeviceHealthDrawer from "../../components/DeviceHealthDrawer";
import DeviceFormDialog from "../../components/DeviceFormDialog";

import apiClient from "../../services/apiClient";
import { SocketConnect, SocketSubscribe } from "../../services/socket_service";
import { HEALTH_THRESHOLDS } from "../../services/global_variable";
import { formatDate } from "../../utils/dateFormat";

const COLUMNS = [
  { id: "device", label: "อุปกรณ์" },
  { id: "owner", label: "เจ้าของ" },
  { id: "firmware", label: "Firmware" },
  { id: "battery", label: "แบตเตอรี่", align: "center", width: 110 },
  { id: "online_status", label: "สถานะ", align: "center", width: 120 },
  { id: "last_seen", label: "เชื่อมต่อล่าสุด", width: 150 },
  { id: "actions", label: "", align: "center", width: 110 },
];

const CSV_COLUMNS = [
  { key: "name", label: "ชื่ออุปกรณ์" },
  { key: "device_id", label: "รหัสอุปกรณ์" },
  { key: "owner_name", label: "เจ้าของ" },
  { key: "firmware_version", label: "Firmware" },
  { key: "battery_level", label: "แบตเตอรี่ (%)" },
  { key: "online_status", label: "สถานะ" },
  { key: "last_seen", label: "เชื่อมต่อล่าสุด" },
];

export default function AdminDevicesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();

  const [devices, setDevices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [onlineFilter, setOnlineFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [healthDevice, setHealthDevice] = useState(null);
  const [selected, setSelected] = useState([]);

  const ADMIN_USER_ID = getUserInfo()?.user_id;

  const createDialog = useDialogState();
  const editDialog = useDialogState();
  const deleteDialog = useDialogState();
  const bulkDeleteDialog = useDialogState();

  // Real-time status via Socket.IO
  useEffect(() => {
    let unsub = null;
    async function subscribe() {
      await SocketConnect();
      unsub = await SocketSubscribe("device_status", (payload) => {
        setDevices((prev) =>
          prev.map((d) =>
            d.device_id === payload.device_id
              ? { ...d, online_status: payload.online_status, last_seen: payload.last_seen || d.last_seen }
              : d
          )
        );
      });
    }
    subscribe().catch(console.warn);
    return () => unsub?.();
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      if (onlineFilter) params.online_status = onlineFilter;
      const { data } = await apiClient.get("/api/admin/devices", { params });
      setDevices(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
      setSelected([]);
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

  const handleCreate = async (values) => {
    try {
      await apiClient.post("/api/devices", { ...values, user_id: ADMIN_USER_ID });
      enqueueSnackbar("เพิ่มอุปกรณ์สำเร็จ", { variant: "success" });
      createDialog.close();
      fetchDevices();
    } catch {
      enqueueSnackbar("เพิ่มอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleSaveEdit = async (values) => {
    try {
      await apiClient.put(`/api/admin/devices/${editDialog.state.item._id}`, values);
      enqueueSnackbar("แก้ไขอุปกรณ์สำเร็จ", { variant: "success" });
      editDialog.close();
      fetchDevices();
    } catch {
      enqueueSnackbar("แก้ไขอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await apiClient.delete(`/api/admin/devices/${deleteDialog.state.item}`);
      enqueueSnackbar("ลบอุปกรณ์สำเร็จ", { variant: "success" });
      deleteDialog.close();
      fetchDevices();
    } catch {
      enqueueSnackbar("ลบอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await apiClient.delete("/api/admin/devices/bulk-delete", { data: { ids: selected } });
      enqueueSnackbar(`ลบ ${selected.length} อุปกรณ์สำเร็จ`, { variant: "success" });
      bulkDeleteDialog.close();
      fetchDevices();
    } catch {
      enqueueSnackbar("ลบอุปกรณ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelected((prev) =>
      prev.length === devices.length ? [] : devices.map((d) => d._id)
    );
  };

  const csvData = devices.map((d) => ({
    ...d,
    owner_name: d.owner ? `${d.owner.first_name} ${d.owner.last_name}` : "—",
    online_status: d.online_status ? "ออนไลน์" : "ออฟไลน์",
    last_seen: formatDate(d.last_seen),
    battery_level: d.battery_level ?? "—",
  }));

  return (
    <AdminPageWrapper
      title="จัดการอุปกรณ์"
        action={
        <Stack direction="row" spacing={1}>
          <ExportButton data={csvData} columns={CSV_COLUMNS} filename="admin-devices" />
          <Button variant="contained" size="small" startIcon={<AddCircleIcon />} onClick={createDialog.open}>
            เพิ่มอุปกรณ์
          </Button>
        </Stack>
      }
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
                { value: "true", label: "ออนไลน์" },
                { value: "false", label: "ออฟไลน์" },
              ],
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
        rows={devices}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPagination((prev) => ({ ...prev, page: p }))}
        onRowsPerPageChange={(l) => setPagination((prev) => ({ ...prev, limit: l, page: 1 }))}
        emptyText="ไม่พบอุปกรณ์"
        renderRow={(device) => {
          const batteryLow =
            typeof device.battery_level === "number" &&
            device.battery_level < HEALTH_THRESHOLDS.BATTERY_LOW;
          const isSelected = selected.includes(device._id);

          return (
            <TableRow
              key={device._id}
              hover
              selected={isSelected}
              onClick={() => toggleSelect(device._id)}
              sx={{ cursor: "pointer" }}
            >
              {/* Device */}
              <TableCell>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Avatar
                    src={device.image || undefined}
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: device.online_status
                        ? alpha(theme.palette.primary.main, 0.1)
                        : alpha(theme.palette.grey[500], 0.1),
                      color: device.online_status ? "primary.main" : "text.disabled",
                    }}
                  >
                    {!device.image && <DevicesIcon sx={{ fontSize: 18 }} />}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {device.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }} noWrap>
                      {device.device_id}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>

              {/* Owner */}
              <TableCell>
                <Typography variant="body2" noWrap>
                  {device.owner ? `${device.owner.first_name} ${device.owner.last_name}` : "—"}
                </Typography>
                {device.owner?.email && (
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {device.owner.email}
                  </Typography>
                )}
              </TableCell>

              {/* Firmware */}
              <TableCell>
                <Typography variant="body2" color={device.firmware_version ? "text.primary" : "text.disabled"}>
                  {device.firmware_version || "—"}
                </Typography>
                {device.hardware_version && (
                  <Typography variant="caption" color="text.secondary">
                    HW: {device.hardware_version}
                  </Typography>
                )}
              </TableCell>

              {/* Battery */}
              <TableCell align="center">
                {typeof device.battery_level === "number" ? (
                  <Box sx={{ width: 80, mx: "auto" }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} justifyContent="center" sx={{ mb: 0.25 }}>
                      {batteryLow && <BatteryAlertIcon sx={{ fontSize: 14, color: "error.main" }} />}
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        color={batteryLow ? "error.main" : "text.primary"}
                      >
                        {device.battery_level}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={device.battery_level}
                      sx={{
                        height: 4,
                        borderRadius: 2,
                        bgcolor: alpha(
                          batteryLow ? theme.palette.error.main : theme.palette.success.main,
                          0.15
                        ),
                        "& .MuiLinearProgress-bar": {
                          bgcolor: batteryLow ? "error.main" : "success.main",
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.disabled">—</Typography>
                )}
              </TableCell>

              {/* Status (real-time) */}
              <TableCell align="center">
                <Chip
                  icon={<CircleIcon sx={{ fontSize: "8px !important" }} />}
                  label={device.online_status ? "ออนไลน์" : "ออฟไลน์"}
                  color={device.online_status ? "success" : "default"}
                  size="small"
                  sx={{ "& .MuiChip-icon": { color: "inherit" } }}
                />
              </TableCell>

              {/* Last seen */}
              <TableCell>
                <Typography variant="caption" color="text.secondary">
                  {formatDate(device.last_seen)}
                </Typography>
              </TableCell>

              {/* Actions */}
              <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                <Stack direction="row" justifyContent="center">
                  <Tooltip title="ข้อมูลอุปกรณ์">
                    <IconButton size="small" onClick={() => setHealthDevice(device)}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="แก้ไข">
                    <IconButton size="small" color="primary" onClick={() => editDialog.open(device)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton size="small" color="error" onClick={() => deleteDialog.open(device._id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          );
        }}
      />

      {/* Create Device Dialog */}
      <DeviceFormDialog
        open={createDialog.state.open}
        onClose={createDialog.close}
        onSubmit={handleCreate}
        initialData={{}}
        variant="dialog"
        currentUserId={ADMIN_USER_ID}
      />

      {/* Device Health Drawer */}
      <DeviceHealthDrawer
        open={!!healthDevice}
        device={healthDevice}
        onClose={() => setHealthDevice(null)}
      />

      {/* Edit Dialog (full DeviceFormDialog) */}
      <DeviceFormDialog
        open={editDialog.state.open}
        onClose={editDialog.close}
        onSubmit={handleSaveEdit}
        initialData={editDialog.state.item || {}}
        variant="dialog"
      />

      {/* Delete Confirm */}
      <DialogConfirm
        open={deleteDialog.state.open}
        handleClose={deleteDialog.close}
        handleConfirm={handleConfirmDelete}
        title="ลบอุปกรณ์"
        content="ยืนยันลบอุปกรณ์นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
        confirmText="ลบ"
        confirmColor="error"
      />

      {/* Bulk Delete Confirm */}
      <DialogConfirm
        open={bulkDeleteDialog.state.open}
        handleClose={bulkDeleteDialog.close}
        handleConfirm={handleBulkDelete}
        title="ลบอุปกรณ์ที่เลือก"
        content={`ยืนยันลบ ${selected.length} อุปกรณ์? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบทั้งหมด"
        confirmColor="error"
      />
    </AdminPageWrapper>
  );
}
