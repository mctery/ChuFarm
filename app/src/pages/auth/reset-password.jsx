import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Button,
  TextField,
  Typography,
  Divider,
  CircularProgress,
  Stack,
  Box,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { SysResetPassword } from "../../services/auth_service";
import AuthLayout from "../../components/AuthLayout";
import LockResetIcon from "@mui/icons-material/LockReset";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ROUTES } from "../../constants/routes";
import { VALIDATION } from "../../services/global_variable";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    password: "",
    password_confirm: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { password, password_confirm } = formData;

    if (password.length < VALIDATION.minPasswordLength) {
      enqueueSnackbar(
        `รหัสผ่านต้องมีอย่างน้อย ${VALIDATION.minPasswordLength} ตัวอักษร`,
        { variant: "error" }
      );
      return false;
    }

    if (!VALIDATION.uppercaseRegex.test(password)) {
      enqueueSnackbar("รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว", { variant: "error" });
      return false;
    }

    if (!VALIDATION.numberRegex.test(password)) {
      enqueueSnackbar("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว", { variant: "error" });
      return false;
    }

    if (password !== password_confirm) {
      enqueueSnackbar("รหัสผ่านไม่ตรงกัน", { variant: "error" });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const res = await SysResetPassword(token, formData.password);
    setLoading(false);

    if (res) {
      setSuccess(true);
      enqueueSnackbar("รีเซ็ตรหัสผ่านสำเร็จ", { variant: "success" });
    } else {
      enqueueSnackbar("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว", {
        variant: "error",
      });
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <LockResetIcon sx={{ fontSize: 48, color: "error.main" }} />
          <Typography variant="h6" color="error">
            ลิงก์ไม่ถูกต้อง
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            sx={{ py: 1.3, fontSize: "1rem" }}
          >
            ขอลิงก์ใหม่
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout>
        <Stack spacing={2} alignItems="center" sx={{ width: "100%" }}>
          <LockResetIcon sx={{ fontSize: 48, color: "success.main" }} />
          <Typography variant="h6" color="success.main">
            เปลี่ยนรหัสผ่านสำเร็จ
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate(ROUTES.LOGIN)}
            sx={{ py: 1.3, fontSize: "1rem" }}
          >
            เข้าสู่ระบบ
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
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
          ตั้งรหัสผ่านใหม่
        </Typography>
        <Typography variant="body2" color="text.secondary">
          กรุณากรอกรหัสผ่านใหม่ของคุณ
        </Typography>
      </Stack>

      <Divider sx={{ width: "100%", mb: 2 }} />

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          label="รหัสผ่านใหม่"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          autoFocus
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? (
                      <VisibilityOff fontSize="small" />
                    ) : (
                      <Visibility fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          label="ยืนยันรหัสผ่านใหม่"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          value={formData.password_confirm}
          onChange={handleChange}
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
            "ตั้งรหัสผ่านใหม่"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
