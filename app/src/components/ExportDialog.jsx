import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  MenuItem,
  Typography,
  Alert,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import apiClient from "../services/apiClient";

const REPORT_TYPES = [
  { value: "csv", label: "ข้อมูล CSV (รายละเอียด)", ext: "csv" },
  { value: "json", label: "ข้อมูล JSON", ext: "json" },
  { value: "daily", label: "รายงานรายวัน (สรุป)", ext: "json" },
  { value: "weekly", label: "รายงานรายสัปดาห์ (สรุป)", ext: "json" },
];

const SENSOR_TYPE_OPTIONS = [
  { value: "", label: "ทุกประเภท" },
  { value: "temperature", label: "อุณหภูมิ" },
  { value: "humidity", label: "ความชื้น" },
  { value: "light", label: "แสง" },
  { value: "soil", label: "ความชื้นดิน" },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function sevenDaysAgoStr() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

export default function ExportDialog({ open, onClose, deviceId, deviceName }) {
  const [reportType, setReportType] = useState("csv");
  const [sensorType, setSensorType] = useState("");
  const [startDate, setStartDate] = useState(sevenDaysAgoStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));

  function validate() {
    if (!startDate || !endDate) return "กรุณาเลือกวันที่";
    if (new Date(startDate) > new Date(endDate)) return "วันเริ่มต้นต้องมาก่อนวันสิ้นสุด";
    if (daysDiff > 31) return "ช่วงเวลาต้องไม่เกิน 31 วัน";
    return "";
  }

  async function handleExport() {
    const err = validate();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);
    try {
      let url, params;
      const selectedType = REPORT_TYPES.find((t) => t.value === reportType);

      if (reportType === "csv") {
        url = `/api/export/sensors/${deviceId}`;
        params = { start_date: startDate, end_date: endDate, ...(sensorType && { sensor_type: sensorType }) };
      } else if (reportType === "json") {
        url = `/api/export/sensors/${deviceId}/json`;
        params = { start_date: startDate, end_date: endDate, ...(sensorType && { sensor_type: sensorType }) };
      } else if (reportType === "daily") {
        url = `/api/export/report/daily/${deviceId}`;
        params = { start_date: startDate, end_date: endDate };
      } else {
        url = `/api/export/report/weekly/${deviceId}`;
        params = { start_date: startDate, end_date: endDate };
      }

      const response = await apiClient.get(url, { params, responseType: "blob" });
      const blob = new Blob([response.data]);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      const safeName = (deviceName || deviceId).replace(/[^a-zA-Z0-9_-]/g, "_");
      link.download = `${safeName}_${reportType}_${startDate}_${endDate}.${selectedType.ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      onClose();
    } catch {
      setError("ส่งออกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>ส่งออกข้อมูล</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField
            select
            size="small"
            fullWidth
            label="ประเภทรายงาน"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            {REPORT_TYPES.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>

          {(reportType === "csv" || reportType === "json") && (
            <TextField
              select
              size="small"
              fullWidth
              label="ประเภทเซ็นเซอร์"
              value={sensorType}
              onChange={(e) => setSensorType(e.target.value)}
            >
              {SENSOR_TYPE_OPTIONS.map((o) => (
                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            size="small"
            fullWidth
            label="วันที่เริ่มต้น"
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setError(""); }}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            size="small"
            fullWidth
            label="วันที่สิ้นสุด"
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setError(""); }}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          {startDate && endDate && !error && (
            <Typography variant="caption" color="text.secondary">
              {daysDiff} วัน (สูงสุด 31 วัน)
            </Typography>
          )}

          {error && <Alert severity="error" sx={{ py: 0.5 }}>{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button
          variant="contained"
          startIcon={<FileDownloadIcon />}
          onClick={handleExport}
          loading={loading}
        >
          ส่งออก
        </Button>
      </DialogActions>
    </Dialog>
  );
}
