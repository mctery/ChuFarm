import { Box, Typography, Alert } from "@mui/material";
import { isAdmin } from "../../services/permission_service";

export default function AdminPageWrapper({ title, children, action }) {
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}
