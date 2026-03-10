import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useSnackbar } from "notistack";

import { SysSendDeviceCommand } from "../services/device_service";

const EMPTY_FORM = { command: "", payload: "" };

export default function DeviceCommandDialog({ open, device, onClose }) {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.command.trim()) errs.command = "กรุณากรอกคำสั่ง";
    if (form.payload.trim()) {
      try {
        JSON.parse(form.payload);
      } catch {
        errs.payload = "Payload ต้องเป็น JSON ที่ถูกต้อง";
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = form.payload.trim() ? JSON.parse(form.payload) : {};
      const res = await SysSendDeviceCommand(device._id, form.command.trim(), payload);
      if (res !== null) {
        enqueueSnackbar("ส่งคำสั่งสำเร็จ", { variant: "success" });
        handleClose();
      } else {
        enqueueSnackbar("ส่งคำสั่งไม่สำเร็จ", { variant: "error" });
      }
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>ส่งคำสั่งอุปกรณ์</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            อุปกรณ์: <strong>{device?.name}</strong> ({device?.device_id})
          </Typography>
          <Alert severity="info" sx={{ py: 0.5 }}>
            คำสั่งจะถูกส่งผ่าน MQTT ไปยังอุปกรณ์โดยตรง
          </Alert>
          <TextField
            label="คำสั่ง (Command)"
            name="command"
            value={form.command}
            onChange={handleChange}
            error={!!errors.command}
            helperText={errors.command || "เช่น on, off, reset, blink"}
            fullWidth
            size="small"
            autoFocus
          />
          <TextField
            label="Payload (JSON, ไม่บังคับ)"
            name="payload"
            value={form.payload}
            onChange={handleChange}
            error={!!errors.payload}
            helperText={errors.payload || 'เช่น {"duration": 5000}'}
            fullWidth
            size="small"
            multiline
            rows={3}
            placeholder='{}'
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          loading={loading}
          startIcon={<SendIcon />}
        >
          ส่งคำสั่ง
        </Button>
      </DialogActions>
    </Dialog>
  );
}
