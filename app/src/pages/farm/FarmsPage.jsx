import { useState, useEffect, useCallback } from "react";
import { useDialogState } from "../../hooks/useDialogState";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Typography,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import SearchIcon from "@mui/icons-material/Search";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";

import SkeletonCardGrid from "../../components/SkeletonCardGrid";
import EmptyState from "../../components/EmptyState";
import ErrorStateCard from "../../components/ErrorStateCard";
import DialogConfirm from "../../components/DialogConfirm";
import { ROUTES } from "../../constants/routes";
import {
  SysGetFarms,
  SysCreateFarm,
  SysUpdateFarm,
  SysDeleteFarm,
} from "../../services/farm_service";

const FARM_TYPES = [
  { value: "greenhouse", label: "โรงเรือน (Greenhouse)" },
  { value: "openfield", label: "กลางแจ้ง (Open Field)" },
  { value: "indoor", label: "ในร่ม (Indoor)" },
  { value: "hydroponic", label: "ไฮโดรโปนิกส์ (Hydroponic)" },
  { value: "other", label: "อื่นๆ" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  farm_type: "other",
  total_area: "",
  location: { address: "" },
};

export default function FarmsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [loading, setLoading] = useState(true);
  const [farms, setFarms] = useState([]);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  // Dialog state
  const dialog = useDialogState();
  const deleteDialog = useDialogState();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchFarms = useCallback(async () => {
    setError(false);
    try {
      const data = await SysGetFarms();
      setFarms(data);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchFarms().then(() => setLoading(false));
  }, [fetchFarms]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    dialog.open(null);
  }

  function openEdit(farm) {
    setForm({
      name: farm.name || "",
      description: farm.description || "",
      farm_type: farm.farm_type || "other",
      total_area: farm.total_area ?? "",
      location: { address: farm.location?.address || "" },
    });
    setErrors({});
    dialog.open(farm);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "address") {
      setForm((prev) => ({ ...prev, location: { address: value } }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "กรุณากรอกชื่อฟาร์ม";
    if (form.total_area !== "" && Number(form.total_area) < 0) {
      errs.total_area = "พื้นที่ต้องไม่ติดลบ";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        farm_type: form.farm_type,
        total_area: form.total_area !== "" ? Number(form.total_area) : undefined,
        location: { address: form.location.address.trim() },
      };

      let result;
      if (dialog.state.item) {
        result = await SysUpdateFarm(dialog.state.item._id, payload);
      } else {
        result = await SysCreateFarm(payload);
      }

      if (result) {
        enqueueSnackbar(dialog.state.item ? "แก้ไขฟาร์มสำเร็จ" : "สร้างฟาร์มสำเร็จ", { variant: "success" });
        dialog.close();
        await fetchFarms();
      } else {
        enqueueSnackbar("บันทึกข้อมูลไม่สำเร็จ", { variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog.state.item) return;
    setDeleting(true);
    const ok = await SysDeleteFarm(deleteDialog.state.item._id);
    setDeleting(false);
    if (ok) {
      enqueueSnackbar("ลบฟาร์มสำเร็จ", { variant: "success" });
      deleteDialog.close();
      await fetchFarms();
    } else {
      enqueueSnackbar("ลบฟาร์มไม่สำเร็จ", { variant: "error" });
    }
  }

  const filtered = farms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <SkeletonCardGrid count={8} height={150} />;
  if (error) return <Box sx={{ p: 3 }}><ErrorStateCard message="โหลดข้อมูลฟาร์มไม่สำเร็จ" onRetry={fetchFarms} /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            ฟาร์มของฉัน
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {farms.length} ฟาร์ม
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          เพิ่มฟาร์ม
        </Button>
      </Stack>

      {/* Search */}
      <TextField
        size="small"
        placeholder="ค้นหาฟาร์ม..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3, maxWidth: 320 }}
      />

      {/* Farm Cards */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AgricultureIcon}
          title={search ? "ไม่พบฟาร์มที่ค้นหา" : "ยังไม่มีฟาร์ม"}
          description={!search ? "กดเพิ่มฟาร์มเพื่อเริ่มต้น" : undefined}
          variant={search ? "search" : "page"}
          action={!search ? (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              เพิ่มฟาร์มแรก
            </Button>
          ) : undefined}
        />
      ) : (
        <Grid container spacing={2}>
          {filtered.map((farm) => (
            <Grid key={farm._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardActionArea
                  sx={{ flex: 1 }}
                  onClick={() => navigate(ROUTES.FARM_DETAIL(farm._id))}
                >
                  <CardContent>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Avatar
                        src={farm.image || undefined}
                        sx={{ bgcolor: "primary.light", color: "primary.contrastText", mt: 0.5 }}
                      >
                        {!farm.image && <AgricultureIcon />}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {farm.name}
                        </Typography>
                        {farm.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 2,
                              overflow: "hidden",
                            }}
                          >
                            {farm.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={0.5}>
                          <Chip
                            label={FARM_TYPES.find((t) => t.value === farm.farm_type)?.label || farm.farm_type}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {farm.total_area ? (
                            <Chip label={`${farm.total_area} ไร่`} size="small" variant="outlined" />
                          ) : null}
                        </Stack>
                        {farm.location?.address && (
                          <Typography variant="caption" color="text.secondary" display="block" mt={0.5} noWrap>
                            📍 {farm.location.address}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
                {/* Actions */}
                <Box sx={{ px: 1.5, pb: 1.5, display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
                  <Tooltip title="แก้ไข">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(farm);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="ลบ">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDialog.open(farm);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialog.state.open}
        onClose={dialog.close}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{dialog.state.item ? "แก้ไขฟาร์ม" : "เพิ่มฟาร์มใหม่"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="ชื่อฟาร์ม"
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
              label="ประเภทฟาร์ม"
              name="farm_type"
              value={form.farm_type}
              onChange={handleChange}
              fullWidth
              size="small"
            >
              {FARM_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="พื้นที่ (ไร่)"
              name="total_area"
              type="number"
              value={form.total_area}
              onChange={handleChange}
              error={!!errors.total_area}
              helperText={errors.total_area}
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
            />
            <TextField
              label="ที่อยู่ / สถานที่"
              name="address"
              value={form.location.address}
              onChange={handleChange}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.close} disabled={saving}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave} variant="contained" loading={saving}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <DialogConfirm
        open={deleteDialog.state.open}
        title="ยืนยันการลบฟาร์ม"
        content={`คุณต้องการลบฟาร์ม "${deleteDialog.state.item?.name}" ใช่หรือไม่?`}
        handleConfirm={handleDelete}
        handleClose={deleteDialog.close}
        loading={deleting}
        confirmColor="error"
      />
    </Box>
  );
}
