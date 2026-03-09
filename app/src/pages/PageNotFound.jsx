import { Button, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useNavigate } from "react-router";
import AuthLayout from "../components/AuthLayout";
import { getToken } from "../services/storage_service";
import { ROUTES } from "../constants/routes";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      maxWidth={null}
      paperSx={{
        bgcolor: "background.paper",
        p: 5,
        borderRadius: 2,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ErrorOutlineIcon sx={{ fontSize: 80, color: "error.main", mb: 1 }} />
      <Typography variant="h2" color="error" gutterBottom sx={{ fontWeight: "bold" }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" paragraph>
        ไม่พบหน้าที่ต้องการ
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        หน้าที่คุณกำลังมองหาไม่มีอยู่หรือถูกย้ายไปแล้ว
      </Typography>
      <Button
        variant="contained"
        color="success"
        onClick={() => {
          if (window.history.length > 2) {
            navigate(-1);
          } else {
            navigate(getToken() ? ROUTES.DASHBOARD : ROUTES.LOGIN);
          }
        }}
      >
        กลับหน้าหลัก
      </Button>
    </AuthLayout>
  );
}

