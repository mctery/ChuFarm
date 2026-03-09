import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import CodeIcon from "@mui/icons-material/Code";
import StorageIcon from "@mui/icons-material/Storage";
import DevicesIcon from "@mui/icons-material/Devices";

const TECH_STACK = [
  { label: "React 19", color: "primary" },
  { label: "MUI v7", color: "primary" },
  { label: "Vite 6", color: "secondary" },
  { label: "MQTT.js", color: "success" },
  { label: "GridStack", color: "info" },
  { label: "Express.js", color: "warning" },
  { label: "MongoDB", color: "success" },
  { label: "Socket.IO", color: "error" },
];

export default function AboutPage() {
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: "primary.main" }}>
              <AgricultureIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Smart Chu Farm
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ระบบจัดการฟาร์มอัจฉริยะ
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body1" color="text.secondary">
            Smart Chu Farm เป็นระบบ IoT สำหรับติดตามและจัดการฟาร์มอัจฉริยะ
            สามารถเชื่อมต่อเซ็นเซอร์หลากหลายประเภท ติดตามข้อมูลแบบ Real-time
            ผ่าน MQTT และดูประวัติข้อมูลย้อนหลังผ่านกราฟ
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <DevicesIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  IoT Management
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                จัดการอุปกรณ์ IoT เพิ่ม/ลบ/แก้ไขอุปกรณ์ ตั้งค่าเซ็นเซอร์
                และจัดวาง Dashboard ด้วย GridStack
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <StorageIcon color="success" />
                <Typography variant="h6" fontWeight={600}>
                  Real-time Data
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                รับข้อมูลเซ็นเซอร์แบบ Real-time ผ่าน MQTT Protocol
                แสดงผลผ่าน Gauge Widget พร้อมข้อมูลสภาพอากาศ
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <CodeIcon color="info" />
                <Typography variant="h6" fontWeight={600}>
                  Data Analytics
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                วิเคราะห์ข้อมูลย้อนหลัง ดูกราฟแนวโน้ม ค่าเฉลี่ย
                ค่าสูงสุด/ต่ำสุด ของแต่ละเซ็นเซอร์
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Tech Stack
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {TECH_STACK.map((tech) => (
              <Chip key={tech.label} label={tech.label} color={tech.color} variant="outlined" size="small" />
            ))}
          </Stack>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Version 1.0.0
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
