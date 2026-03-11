import React, { useState } from "react";
import {
  Box,
  Drawer,
  Typography,
  Button,
  ButtonGroup,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  CircularProgress,
} from "@mui/material";

import LeakAddTwoToneIcon from "@mui/icons-material/LeakAddTwoTone";

import { SysCreateSensor, SysUpdateDeviceSensors, SysDeleteSensor } from "../../services/sensor_service";
import { getUserInfo } from "../../services/storage_service";
import { ICON, SENSORS_TYPE } from "../../services/global_variable";

const DRAWER_CONFIG = {
  sensor: {
    title: "เพิ่มวิดเจ็ตเซนเซอร์",
    addLabel: "เพิ่มเซนเซอร์",
    showSensorName: true,
    showColorPicker: true,
    initialFormData: { sensor_name: "", sensor_type: "", sensor_id: "", unit: "", bgcolor: "", status: true },
  },
  other: {
    title: "เพิ่มวิดเจ็ตอื่นๆ",
    addLabel: null,
    showSensorName: false,
    showColorPicker: false,
    initialFormData: { sensor_type: "", sensor_id: "", unit: "", status: true },
  },
};

export default function DrawerWidgetManager({
  open,
  onClose,
  sensors = [],
  onAddSensor,
  onUpdateSensor,
  onDeleteSensor,
  deviceId,
  type = "sensor",
}) {
  const config = DRAWER_CONFIG[type];
  const CURRENT_USER_ID = getUserInfo()?.user_id;
  const [openForm, setOpenForm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ ...config.initialFormData, user_id: CURRENT_USER_ID });
  const [loading, setLoading] = useState(false);

  const capitalizeFirstLetter = (val) =>
    String(val).charAt(0).toUpperCase() + String(val).slice(1);

  const resetForm = () => {
    setFormData({ ...config.initialFormData, user_id: CURRENT_USER_ID });
    setEditId(null);
    setIsEditMode(false);
    setOpenForm(false);
  };

  const openAddSensorForm = () => {
    resetForm();
    setOpenForm(true);
  };

  const handleEditSensor = (sensor) => {
    const data = {
      sensor_type: sensor.sensor_type,
      sensor_id: sensor.sensor_id,
      unit: sensor.unit || "",
      status: sensor.status || true,
    };
    if (config.showSensorName) {
      data.sensor_name = sensor.sensor_name || "";
    }
    if (config.showColorPicker) {
      data.bgcolor = sensor.bgcolor || "";
    }
    setFormData(data);
    setEditId(sensor._id);
    setIsEditMode(true);
    setOpenForm(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        device_id: deviceId,
        ...formData,
        updated_at: new Date().toISOString(),
      };

      let res;
      if (isEditMode && editId) {
        res = await SysUpdateDeviceSensors(editId, payload);
      } else {
        payload.time = new Date().toISOString();
        res = await SysCreateSensor(payload);
      }

      if (res) {
        if (isEditMode) {
          onUpdateSensor?.(res);
        } else {
          onAddSensor?.(res);
        }
      }
    } catch (err) {
      console.error("Sensor save error:", err);
    } finally {
      setLoading(false);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!editId) return;

    const confirm = window.confirm("คุณต้องการลบเซนเซอร์นี้หรือไม่?");
    if (!confirm) return;

    try {
      setLoading(true);
      await SysDeleteSensor(editId);
      onDeleteSensor?.({ _id: editId });
    } catch (err) {
      console.error("ลบ sensor ไม่สำเร็จ:", err);
    } finally {
      setLoading(false);
      resetForm();
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 500, p: 2, pt: 10 }} role="presentation">
        <Typography variant="h6" sx={{ mb: 2 }}>
          {config.title}
        </Typography>

        {config.addLabel && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<LeakAddTwoToneIcon />}
              onClick={openAddSensorForm}
            >
              {config.addLabel}
            </Button>
          </Stack>
        )}

        <Divider sx={{ my: 2 }} />

        <List>
          {sensors.length > 0 ? (
            sensors.map((sensor, index) => (
              <ListItem key={`sensor-${index}`} sx={{ cursor: "pointer" }}>
                <ListItemIcon>
                  {SENSORS_TYPE[sensor.sensor_type]?.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    config.showSensorName
                      ? sensor.sensor_name
                      : capitalizeFirstLetter(sensor.sensor_type)
                  }
                  secondary={`${capitalizeFirstLetter(sensor.sensor_type)} ID: ${sensor.sensor_id}`}
                />
                <ButtonGroup size="small" variant="contained">
                  <Button
                    color="success"
                    startIcon={ICON.ADD.icon}
                    size="small"
                    onClick={() => onAddSensor?.(sensor)}
                  >
                    เพิ่ม
                  </Button>
                  <Button
                    color="warning"
                    startIcon={ICON.EDIT.icon}
                    size="small"
                    onClick={() => handleEditSensor(sensor)}
                  >
                    แก้ไข
                  </Button>
                </ButtonGroup>
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" sx={{ mt: 1 }}>
              ไม่พบเซนเซอร์ที่เชื่อมต่อ
            </Typography>
          )}
        </List>
      </Box>

      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEditMode ? "แก้ไขเซนเซอร์" : "เพิ่มเซนเซอร์ใหม่"}
        </DialogTitle>
        <DialogContent>
          {config.showSensorName && (
            <TextField
              label="ชื่อเซ็นเซอร์"
              size="small"
              fullWidth
              margin="normal"
              value={formData.sensor_name || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, sensor_name: e.target.value }))}
            />
          )}
          <TextField
            label="ประเภทเซ็นเซอร์"
            size="small"
            fullWidth
            margin="normal"
            value={formData.sensor_type}
            onChange={(e) => setFormData((prev) => ({ ...prev, sensor_type: e.target.value }))}
          />
          <TextField
            label="รหัสเซ็นเซอร์"
            size="small"
            fullWidth
            margin="normal"
            value={formData.sensor_id}
            onChange={(e) => setFormData((prev) => ({ ...prev, sensor_id: e.target.value }))}
          />
          <TextField
            label="หน่วย (°C, %, lux)"
            size="small"
            fullWidth
            margin="normal"
            value={formData.unit}
            onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
          />
          {config.showColorPicker && (
            <TextField
              label="รหัสสี"
              type="color"
              size="small"
              fullWidth
              margin="normal"
              value={formData.bgcolor || ""}
              onChange={(e) => setFormData((prev) => ({ ...prev, bgcolor: e.target.value }))}
            />
          )}

          <Divider sx={{ my: 1 }} />
          <Stack direction="row" spacing={2} justifyContent="space-between">
            {isEditMode && (
              <Button onClick={handleDelete} color="error" variant="outlined" disabled={loading}>
                ลบเซนเซอร์
              </Button>
            )}
            <Stack direction="row" spacing={2}>
              <Button onClick={() => setOpenForm(false)}>ยกเลิก</Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {isEditMode ? "อัปเดต" : "บันทึก"}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
}
