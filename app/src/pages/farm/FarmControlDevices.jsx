import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Grid,
  Typography,
  Stack,
  Paper,
  Pagination,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { Outlet } from "react-router-dom";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DevicesIcon from "@mui/icons-material/Devices";
import SearchIcon from "@mui/icons-material/Search";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import {
  SysGetDevicesPaginated,
  SysCreateDevice,
  SysUpdateDevice,
  SysDeleteDevice,
} from "../../services/device_service";
import { getUserInfo } from "../../services/storage_service";
import DeviceWidget from "../../components/DeviceWidget";
import DeviceFormDialog from "../../components/DeviceFormDialog";
import BoxLoading from "../../components/BoxLoading";
import DialogConfirm from "../../components/DialogConfirm";

import { animated as Animated, useSprings } from "@react-spring/web";
import { SocketConnect, SocketRefreshRooms } from "../../services/socket_service";
import { PAGINATION } from "../../services/global_variable";

export default function FarmControlDevices() {
  const [devices, setDevices] = useState([]);
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentDevice, setCurrentDevice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const CURRENT_USER_ID = getUserInfo()?.user_id;

  const fetchDevices = async (targetPage = page) => {
    await SocketConnect();
    setLoading(true);
    const { devices: data, pagination } = await SysGetDevicesPaginated(targetPage, PAGINATION.DEVICES_PER_PAGE);
    setDevices(Array.isArray(data) ? data : []);
    if (pagination) {
      setTotalPages(pagination.totalPages);
      setTotalDevices(pagination.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDevices(page);
  }, [page]);

  const filteredDevices = useMemo(() => {
    let result = devices;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.device_id?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "online") result = result.filter((d) => d.online_status);
    else if (statusFilter === "offline") result = result.filter((d) => !d.online_status);
    return result;
  }, [devices, search, statusFilter]);

  const springs = useSprings(
    filteredDevices.length,
    filteredDevices.map((_, i) => ({
      from: { opacity: 0, transform: "translateY(16px)" },
      to: { opacity: 1, transform: "translateY(0)" },
      delay: i * 60,
    }))
  );

  const openAddDialog = () => {
    setCurrentDevice(null);
    setAddOpen(true);
  };

  const handleEdit = (device) => {
    setCurrentDevice(device);
    setEditOpen(true);
  };

  const handleDelete = (device) => setDeleteTarget(device);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await SysDeleteDevice(deleteTarget._id);
    if (success) {
      enqueueSnackbar("ลบอุปกรณ์เรียบร้อยแล้ว", { variant: "success" });
      SocketRefreshRooms();
      fetchDevices(page);
    } else {
      enqueueSnackbar("เกิดข้อผิดพลาดในการลบอุปกรณ์", { variant: "error" });
    }
    setDeleteTarget(null);
  };

  const handleSubmit = async (values) => {
    const payload = { ...values, user_id: CURRENT_USER_ID };

    if (currentDevice) {
      const updated = await SysUpdateDevice(currentDevice._id, payload);
      if (updated) {
        enqueueSnackbar("บันทึกการแก้ไขเรียบร้อยแล้ว", { variant: "success" });
        fetchDevices(page);
      } else {
        enqueueSnackbar("ไม่สามารถแก้ไขอุปกรณ์ได้", { variant: "error" });
      }
    } else {
      const created = await SysCreateDevice(payload);
      if (created) {
        enqueueSnackbar("เพิ่มอุปกรณ์ใหม่เรียบร้อยแล้ว", { variant: "success" });
        SocketRefreshRooms();
        fetchDevices(page);
      } else {
        enqueueSnackbar("ไม่สามารถเพิ่มอุปกรณ์ได้", { variant: "error" });
      }
    }

    setAddOpen(false);
    setEditOpen(false);
    setCurrentDevice(null);
  };

  const onlineCount = devices.filter((d) => d.online_status).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            อุปกรณ์ทั้งหมด
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalDevices > 0
              ? `มีอุปกรณ์ ${totalDevices} เครื่อง`
              : "จัดการอุปกรณ์ IoT ในฟาร์มของคุณ"}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircleIcon />} onClick={openAddDialog}>
          เพิ่มอุปกรณ์
        </Button>
      </Stack>

      {/* Search + Filter */}
      {devices.length > 0 && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ sm: "center" }}
          sx={{ mb: 2.5 }}
        >
          <TextField
            size="small"
            placeholder="ค้นหาอุปกรณ์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 20, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            size="small"
            onChange={(_, val) => val !== null && setStatusFilter(val)}
            sx={{
              "& .MuiToggleButton-root": {
                px: 1.5,
                borderRadius: "8px !important",
                mx: 0.25,
                border: "none",
                "&.Mui-selected": { fontWeight: 700 },
              },
            }}
          >
            <ToggleButton value="all">
              ทั้งหมด
              <Chip label={devices.length} size="small" sx={{ ml: 0.5, height: 20, fontSize: "0.7rem" }} />
            </ToggleButton>
            <ToggleButton value="online">
              <WifiIcon sx={{ fontSize: 16, mr: 0.5, color: "success.main" }} />
              ออนไลน์
              <Chip label={onlineCount} size="small" color="success" sx={{ ml: 0.5, height: 20, fontSize: "0.7rem" }} />
            </ToggleButton>
            <ToggleButton value="offline">
              <WifiOffIcon sx={{ fontSize: 16, mr: 0.5, color: "text.secondary" }} />
              ออฟไลน์
              <Chip label={offlineCount} size="small" sx={{ ml: 0.5, height: 20, fontSize: "0.7rem" }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      {/* Content */}
      {loading ? (
        <BoxLoading />
      ) : devices.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: "background.default",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <DevicesIcon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ยังไม่มีอุปกรณ์ในระบบ
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            เริ่มต้นด้วยการเพิ่มอุปกรณ์ IoT เครื่องแรกของคุณ
          </Typography>
          <Button variant="contained" startIcon={<AddCircleIcon />} onClick={openAddDialog}>
            เพิ่มอุปกรณ์เครื่องแรก
          </Button>
        </Paper>
      ) : filteredDevices.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: "center",
            bgcolor: "background.default",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <SearchIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            ไม่พบอุปกรณ์ที่ตรงกับการค้นหา
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={2}>
            {springs.map((style, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={filteredDevices[i]._id}>
                <Animated.div style={style}>
                  <DeviceWidget
                    device={filteredDevices[i]}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </Animated.div>
              </Grid>
            ))}
          </Grid>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      <DialogConfirm
        open={!!deleteTarget}
        title="ยืนยันการลบอุปกรณ์"
        content={`คุณต้องการลบอุปกรณ์ "${deleteTarget?.name}" หรือไม่? การลบจะไม่สามารถย้อนกลับได้`}
        handleClose={() => setDeleteTarget(null)}
        handleConfirm={confirmDelete}
      />

      <DeviceFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleSubmit}
        initialData={{}}
        currentUserId={CURRENT_USER_ID}
      />

      <DeviceFormDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmit}
        initialData={currentDevice || {}}
        variant="drawer"
        currentUserId={CURRENT_USER_ID}
      />

      <Outlet />
    </Box>
  );
}
