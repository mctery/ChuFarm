import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Avatar,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

const FAQ = [
  {
    q: "จะเพิ่มอุปกรณ์ใหม่ได้อย่างไร?",
    a: 'ไปที่เมนู "ระบบควบคุมฟาร์ม > อุปกรณ์" แล้วกดปุ่ม "เพิ่มอุปกรณ์" กรอกข้อมูลอุปกรณ์ เช่น ชื่อ, Device ID, และรายละเอียดต่างๆ',
  },
  {
    q: "จะเพิ่มเซ็นเซอร์ลงในอุปกรณ์ได้อย่างไร?",
    a: 'เข้าไปที่หน้า Dashboard ของอุปกรณ์ (GridStack) แล้วกดปุ่ม "เซ็นเซอร์" ที่แถบเครื่องมือด้านบน จะมี Drawer เปิดขึ้นมาให้เพิ่มเซ็นเซอร์ใหม่',
  },
  {
    q: "จะดูประวัติข้อมูลเซ็นเซอร์ได้อย่างไร?",
    a: 'กดปุ่ม "ประวัติข้อมูล" ในหน้า Dashboard ของอุปกรณ์ จะนำไปหน้ากราฟที่แสดงข้อมูลย้อนหลัง สามารถเลือกช่วงเวลาและเซ็นเซอร์ที่ต้องการดูได้',
  },
  {
    q: "จะจัดเรียง Widget บน Dashboard ได้อย่างไร?",
    a: 'ลาก Widget ไปวางตำแหน่งที่ต้องการ แล้วกดปุ่ม "บันทึกตำแหน่ง" เพื่อบันทึกการจัดวาง',
  },
  {
    q: "ข้อมูลเซ็นเซอร์อัปเดตบ่อยแค่ไหน?",
    a: "ข้อมูลอัปเดตแบบ Real-time ผ่าน MQTT Protocol ทุกครั้งที่อุปกรณ์ส่งข้อมูลเข้ามา Widget จะแสดงค่าล่าสุดทันที",
  },
  {
    q: "Dark Mode ทำงานอย่างไร?",
    a: "กดปุ่มไอคอนพระจันทร์/ดวงอาทิตย์ ที่มุมขวาบนของหน้าจอ ระบบจะจำการตั้งค่าไว้แม้ปิดหน้าเว็บแล้วเปิดใหม่",
  },
];

export default function HelpPage() {
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 48, height: 48, bgcolor: "info.main" }}>
              <HelpOutlineIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                ศูนย์ช่วยเหลือ
              </Typography>
              <Typography variant="body2" color="text.secondary">
                คำถามที่พบบ่อยเกี่ยวกับการใช้งานระบบ ChuFarm
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box>
        {FAQ.map((item, i) => (
          <Accordion key={i} defaultExpanded={i === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{item.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {item.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Box>
  );
}
