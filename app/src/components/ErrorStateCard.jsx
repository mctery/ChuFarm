import { Box, Typography, Button } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

export default function ErrorStateCard({ message = "โหลดข้อมูลไม่สำเร็จ", onRetry, sx }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        p: 5,
        border: "1px solid",
        borderColor: "error.light",
        borderRadius: 3,
        bgcolor: (theme) => theme.palette.mode === "light" ? "rgba(211,47,47,0.03)" : "rgba(211,47,47,0.06)",
        color: "text.secondary",
        ...sx,
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 48, color: "error.main", mb: 1.5 }} />
      <Typography variant="subtitle1" fontWeight={600} color="error.main" mb={0.5}>
        เกิดข้อผิดพลาด
      </Typography>
      <Typography variant="body2" color="text.disabled" mb={onRetry ? 2 : 0}>
        {message}
      </Typography>
      {onRetry && (
        <Button size="small" variant="outlined" color="error" onClick={onRetry}>
          ลองใหม่
        </Button>
      )}
    </Box>
  );
}
