import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  Divider,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import imageCompression from "browser-image-compression";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import NoImage from "../assets/no_image.jpg";
import { SysGetFarms, SysGetZonesByFarm } from "../services/farm_service";
import { SysGetDeviceProfiles } from "../services/device_profile_service";

export default function DeviceFormDialog({
  open,
  onClose,
  onSubmit,
  initialData = {},
  variant = "dialog",
  currentUserId,
  loading = false,
}) {
  const [formData, setFormData] = useState({
    device_id: "",
    name: "",
    image: "",
    version: "1.0",
    status: false,
    farm_id: "",
    zone_id: "",
    profile_id: "",
    firmware_version: "",
    hardware_version: "",
    user_id: currentUserId || "",
  });
  const [farms, setFarms] = useState([]);
  const [zones, setZones] = useState([]);
  const [profiles, setProfiles] = useState([]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const fileInputRef = useRef(null);

  // Load farms + profiles when dialog opens (edit mode)
  useEffect(() => {
    if (!open) return;
    Promise.all([SysGetFarms(), SysGetDeviceProfiles()]).then(([f, p]) => {
      setFarms(f);
      setProfiles(p);
    });
  }, [open]);

  // Load zones when farm changes
  useEffect(() => {
    if (!formData.farm_id) {
      setZones([]);
      return;
    }
    SysGetZonesByFarm(formData.farm_id).then(setZones);
  }, [formData.farm_id]);

  useEffect(() => {
    setFormData({
      device_id: initialData.device_id || "",
      name: initialData.name || "",
      version: initialData.version || "",
      image: initialData.image || "",
      status: initialData.status === "A",
      farm_id: initialData.farm_id || "",
      zone_id: initialData.zone_id || "",
      profile_id: initialData.profile_id || "",
      firmware_version: initialData.firmware_version || "",
      hardware_version: initialData.hardware_version || "",
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      // reset zone when farm changes
      ...(name === "farm_id" ? { zone_id: "" } : {}),
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const options = { maxSizeMB: 0.2, maxWidthOrHeight: 720, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดขณะ compress รูป:", error);
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();
  const triggerFileRemove = () => setFormData((prev) => ({ ...prev, image: "" }));

  const handleSubmit = () => {
    const payload = {
      ...formData,
      status: formData.status ? "A" : "D",
      farm_id: formData.farm_id || null,
      zone_id: formData.zone_id || null,
      profile_id: formData.profile_id || null,
      firmware_version: formData.firmware_version || null,
      hardware_version: formData.hardware_version || null,
    };

    if (!initialData.device_id && currentUserId) {
      payload.user_id = currentUserId.toString();
    }

    onSubmit(payload);
  };

  const formFields = (
    <>
      <TextField
        size="small"
        margin="dense"
        label="รหัสอุปกรณ์"
        name="device_id"
        value={formData.device_id}
        onChange={handleChange}
        fullWidth
        disabled={!!initialData.device_id}
      />
      <TextField
        size="small"
        margin="dense"
        label="ชื่ออุปกรณ์"
        name="name"
        value={formData.name}
        onChange={handleChange}
        fullWidth
      />
      <TextField
        size="small"
        margin="dense"
        label="เวอร์ชัน"
        name="version"
        value={formData.version}
        onChange={handleChange}
        fullWidth
      />

      <Divider sx={{ mt: 1.5, mb: 0.5 }} />
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
        การจัดการ
      </Typography>

      <FormControl size="small" margin="dense" fullWidth>
        <InputLabel>ฟาร์ม</InputLabel>
        <Select name="farm_id" value={formData.farm_id} label="ฟาร์ม" onChange={handleChange}>
          <MenuItem value=""><em>ไม่ระบุ</em></MenuItem>
          {farms.map((f) => (
            <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" margin="dense" fullWidth disabled={!formData.farm_id}>
        <InputLabel>โซน</InputLabel>
        <Select name="zone_id" value={formData.zone_id} label="โซน" onChange={handleChange}>
          <MenuItem value=""><em>ไม่ระบุ</em></MenuItem>
          {zones.map((z) => (
            <MenuItem key={z._id} value={z._id}>{z.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" margin="dense" fullWidth>
        <InputLabel>โปรไฟล์อุปกรณ์</InputLabel>
        <Select name="profile_id" value={formData.profile_id} label="โปรไฟล์อุปกรณ์" onChange={handleChange}>
          <MenuItem value=""><em>ไม่ระบุ</em></MenuItem>
          {profiles.map((p) => (
            <MenuItem key={p._id} value={p._id}>{p.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ mt: 1.5, mb: 0.5 }} />
      <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
        ข้อมูลฮาร์ดแวร์
      </Typography>

      <TextField
        size="small"
        margin="dense"
        label="เวอร์ชัน Firmware"
        name="firmware_version"
        value={formData.firmware_version}
        onChange={handleChange}
        fullWidth
        placeholder="เช่น 1.2.0"
      />
      <TextField
        size="small"
        margin="dense"
        label="เวอร์ชัน Hardware"
        name="hardware_version"
        value={formData.hardware_version}
        onChange={handleChange}
        fullWidth
        placeholder="เช่น rev2"
      />

      <Divider sx={{ mt: 1 }} />
      <Stack direction="column" alignItems="center" spacing={2} sx={{ mb: 1 }}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        {!formData.image ? (
          <Button size="small" startIcon={<AddAPhotoIcon />} onClick={triggerFileSelect}>
            เลือกรูปภาพอุปกรณ์
          </Button>
        ) : (
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={triggerFileRemove}
          >
            ลบรูปภาพอุปกรณ์
          </Button>
        )}
        <Box sx={{ overflow: "hidden", width: 200, height: 200, borderRadius: 1 }}>
          {formData.image ? (
            <img src={formData.image} width={200} height={200} alt="อุปกรณ์" />
          ) : (
            <img src={NoImage} width={200} height={200} alt="no_image" />
          )}
        </Box>
      </Stack>
    </>
  );

  const actions = (
    <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
      <Button size="small" onClick={onClose} color="inherit" disabled={loading}>
        ยกเลิก
      </Button>
      <Button
        size="small"
        onClick={handleSubmit}
        variant="contained"
        color="success"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
      >
        {loading ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </Stack>
  );

  if (variant === "drawer") {
    return (
      <Drawer anchor="right" open={open} onClose={onClose}>
        <Box sx={{ width: 350, p: 2, paddingTop: 10 }} role="presentation">
          <Typography variant="h6" gutterBottom>
            {initialData.device_id ? "ตั้งค่า" : "เพิ่ม"}อุปกรณ์
          </Typography>
          {formFields}
          <Divider />
          {actions}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={isMobile}>
      <DialogTitle>{initialData.device_id ? "ตั้งค่า" : "เพิ่ม"}อุปกรณ์</DialogTitle>
      <DialogContent dividers>{formFields}</DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
}

DeviceFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  variant: PropTypes.oneOf(["dialog", "drawer"]),
  currentUserId: PropTypes.string,
};
