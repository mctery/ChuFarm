import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  TextField,
  Typography,
  Divider,
  CircularProgress,
  Stack,
  Box,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { SysForgotPassword } from "../../services/auth_service";
import AuthLayout from "../../components/AuthLayout";
import LockResetIcon from "@mui/icons-material/LockReset";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { ROUTES } from "../../constants/routes";
import { VALIDATION } from "../../services/global_variable";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!VALIDATION.emailRegex.test(email)) {
      enqueueSnackbar("รูปแบบอีเมลไม่ถูกต้อง", { variant: "error" });
      return;
    }

    setLoading(true);
    await SysForgotPassword(email);
    setLoading(false);

    setSubmitted(true);
    enqueueSnackbar("หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ", {
      variant: "success",
    });
  };

  return (
    <AuthLayout>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          mb: 1,
        }}
      >
        <Button
          variant="text"
          startIcon={<ArrowBackIosNewIcon />}
          onClick={() => navigate(ROUTES.LOGIN)}
          size="small"
          sx={{ color: "text.secondary" }}
        >
          กลับ
        </Button>
      </Box>

      <Stack alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            bgcolor: "primary.main",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LockResetIcon sx={{ fontSize: 30, color: "white" }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
          ลืมรหัสผ่าน
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ
        </Typography>
      </Stack>

      <Divider sx={{ width: "100%", mb: 2 }} />

      {submitted ? (
        <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            กรุณาตรวจสอบอีเมลของคุณ หากอีเมลนี้มีอยู่ในระบบ
            คุณจะได้รับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate(ROUTES.LOGIN)}
            sx={{ py: 1.3, fontSize: "1rem" }}
          >
            กลับหน้าเข้าสู่ระบบ
          </Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <TextField
            size="small"
            margin="normal"
            required
            fullWidth
            id="email"
            label="อีเมล"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 3, mb: 1, py: 1.3, fontSize: "1rem" }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "ส่งลิงก์รีเซ็ตรหัสผ่าน"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
