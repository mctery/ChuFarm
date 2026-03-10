import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  Paper,
  Avatar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import LayersIcon from "@mui/icons-material/Layers";
import { useSnackbar } from "notistack";
import { useNavigate, useParams } from "react-router-dom";

import SkeletonCardGrid from "../../components/SkeletonCardGrid";
import DialogConfirm from "../../components/DialogConfirm";
import { ROUTES } from "../../constants/routes";
import {
  SysGetFarmById,
  SysGetFarmStats,
  SysGetZonesByFarm,
  SysCreateZone,
  SysUpdateZone,
  SysDeleteZone,
} from "../../services/farm_service";

const ZONE_TYPES = [
  { value: "greenhouse", label: "โรงเรือน" },
  { value: "field", label: "แปลงปลูก" },
  { value: "nursery", label: "เรือนเพาะชำ" },
  { value: "storage", label: "โกดัง/เก็บของ" },
  { value: "other", label: "อื่นๆ" },
];

const EMPTY_ZONE = {
  name: "",
  description: "",
  zone_type: "other",
  area: "",
  crop_type: "",
};

export default function FarmDetailPage() {
  const { farmId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [farm, setFarm] = useState(null);
  const [stats, setStats] = useState(null);
  const [zones, setZones] = useState([]);

  // Zone dialog
  const dialog = useDialogState();
  const deleteDialog = useDialogState();
  const [form, setForm] = useState(EMPTY_ZONE);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchAll = useCallback(async () => {
    const [farmData, statsData, zonesData] = await Promise.all([
      SysGetFarmById(farmId),
      SysGetFarmStats(farmId),
      SysGetZonesByFarm(farmId),
    ]);
    setFarm(farmData);
    setStats(statsData);
    setZones(zonesData);
  }, [farmId]);

  useEffect(() => {
    fetchAll().then(() => setLoading(false));
  }, [fetchAll]);

  function openCreateZone() {
    setForm(EMPTY_ZONE);
    setErrors({});
    dialog.open(null);
  }

  function openEditZone(zone) {
    setForm({
      name: zone.name || "",
      description: zone.description || "",
      zone_type: zone.zone_type || "other",
      area: zone.area ?? "",
      crop_type: zone.crop_type || "",
    });
    setErrors({});
    dialog.open(zone);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "กรุณากรอกชื่อโซน";
    if (form.area !== "" && Number(form.area) < 0) errs.area = "พื้นที่ต้องไม่ติดลบ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSaveZone() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        zone_type: form.zone_type,
        area: form.area !== "" ? Number(form.area) : undefined,
        crop_type: form.crop_type.trim(),
      };

      let result;
      if (dialog.state.item) {
        result = await SysUpdateZone(dialog.state.item._id, payload);
      } else {
        result = await SysCreateZone(farmId, payload);
      }

      if (result) {
        enqueueSnackbar(dialog.state.item ? "แก้ไขโซนสำเร็จ" : "สร้างโซนสำเร็จ", { variant: "success" });
        dialog.close();
        await fetchAll();
      } else {
        enqueueSnackbar("บันทึกข้อมูลไม่สำเร็จ", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteZone() {
    if (!deleteDialog.state.item) return;
    setDeleting(true);
    const ok = await SysDeleteZone(deleteDialog.state.item._id);
    setDeleting(false);
    if (ok) {
      enqueueSnackbar("ลบโซนสำเร็จ", { variant: "success" });
      deleteDialog.close();
      await fetchAll();
    } else {
      enqueueSnackbar("ลบโซนไม่สำเร็จ", { variant: "error" });
    }
  }

  if (loading) return <SkeletonCardGrid count={6} height={120} />;

  if (!farm) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">ไม่พบข้อมูลฟาร์ม</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate(ROUTES.FARMS)}>
          กลับไปรายการฟาร์ม
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Back + Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Tooltip title="กลับไปรายการฟาร์ม">
          <IconButton onClick={() => navigate(ROUTES.FARMS)}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Avatar sx={{ bgcolor: "primary.light", color: "primary.contrastText" }}>
          <AgricultureIcon />
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {farm.name}
          </Typography>
          {farm.location?.address && (
            <Typography variant="body2" color="text.secondary">
              📍 {farm.location.address}
            </Typography>
          )}
        </Box>
      </Stack>

      {/* Farm Info */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          {farm.description && (
            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">
                {farm.description}
              </Typography>
            </Grid>
          )}
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">ประเภท</Typography>
            <Typography variant="body2" fontWeight={600}>
              {farm.farm_type || "—"}
            </Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Typography variant="caption" color="text.secondary">พื้นที่</Typography>
            <Typography variant="body2" fontWeight={600}>
              {farm.total_area ? `${farm.total_area} ไร่` : "—"}
            </Typography>
          </Grid>
          {stats && (
            <>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">จำนวนโซน</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats.zone_count ?? zones.length} โซน
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary">จำนวนอุปกรณ์</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {stats.device_count ?? "—"} เครื่อง
                </Typography>
              </Grid>
            </>
          )}
        </Grid>
      </Paper>

      {/* Zones Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight={700}>
          โซน ({zones.length})
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreateZone}>
          เพิ่มโซน
        </Button>
      </Stack>
      <Divider sx={{ mb: 2 }} />

      {zones.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <LayersIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography color="text.secondary">ยังไม่มีโซน กดเพิ่มโซนเพื่อเริ่มต้น</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {zones.map((zone) => (
            <Grid key={zone._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined">
                <CardContent sx={{ pb: "8px !important" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {zone.name}
                      </Typography>
                      {zone.description && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {zone.description}
                        </Typography>
                      )}
                      <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" gap={0.5}>
                        <Chip
                          label={ZONE_TYPES.find((t) => t.value === zone.zone_type)?.label || zone.zone_type}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
                        {zone.area ? (
                          <Chip label={`${zone.area} ไร่`} size="small" variant="outlined" />
                        ) : null}
                        {zone.crop_type && (
                          <Chip label={zone.crop_type} size="small" variant="outlined" color="success" />
                        )}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="แก้ไข">
                        <IconButton size="small" onClick={() => openEditZone(zone)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="ลบ">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteDialog.open(zone)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Zone Create/Edit Dialog */}
      <Dialog
        open={dialog.state.open}
        onClose={dialog.close}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{dialog.state.item ? "แก้ไขโซน" : "เพิ่มโซนใหม่"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="ชื่อโซน"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              fullWidth
              size="small"
              autoFocus
            />
            <TextField
              label="คำอธิบาย"
              name="description"
              value={form.description}
              onChange={handleChange}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
            <TextField
              select
              label="ประเภทโซน"
              name="zone_type"
              value={form.zone_type}
              onChange={handleChange}
              fullWidth
              size="small"
            >
              {ZONE_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="พื้นที่ (ไร่)"
              name="area"
              type="number"
              value={form.area}
              onChange={handleChange}
              error={!!errors.area}
              helperText={errors.area}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
            />
            <TextField
              label="ประเภทพืช/ผล"
              name="crop_type"
              value={form.crop_type}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="เช่น มะเขือเทศ, ผักกาด"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.close} disabled={saving}>
            ยกเลิก
          </Button>
          <Button onClick={handleSaveZone} variant="contained" loading={saving}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Zone Confirm */}
      <DialogConfirm
        open={deleteDialog.state.open}
        title="ยืนยันการลบโซน"
        content={`คุณต้องการลบโซน "${deleteDialog.state.item?.name}" ใช่หรือไม่?`}
        handleConfirm={handleDeleteZone}
        handleClose={deleteDialog.close}
        loading={deleting}
        confirmColor="error"
      />
    </Box>
  );
}
