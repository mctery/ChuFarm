import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
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
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { SysLogin, SysCheckToken } from "../../services/auth_service";
import { getToken } from "../../services/storage_service";
import AuthLayout from "../../components/AuthLayout";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { ROUTES } from "../../constants/routes";
import { VALIDATION } from "../../services/global_variable";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("remember_me") === "true");
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const autoLogin = async () => {
      const token = getToken();
      if (token) {
        const valid = await SysCheckToken({ redirect: false });
        if (valid) {
          navigate(ROUTES.DASHBOARD);
        }
      }
    };
    autoLogin();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "กรุณากรอกอีเมล";
    } else if (!VALIDATION.emailRegex.test(formData.email)) {
      newErrors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (!formData.password) {
      newErrors.password = "กรุณากรอกรหัสผ่าน";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const res = await SysLogin(formData.email, formData.password);
    setLoading(false);

    if (res) {
      localStorage.setItem("remember_me", rememberMe ? "true" : "false");
      enqueueSnackbar("เข้าสู่ระบบสำเร็จ", { variant: "success" });
      navigate(ROUTES.DASHBOARD);
    } else {
      enqueueSnackbar("อีเมลหรือรหัสผ่านไม่ถูกต้อง", { variant: "error" });
    }
  };

  return (
    <AuthLayout layout="split">
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
            mb: 1,
          }}
        >
          <AgricultureIcon sx={{ fontSize: 32, color: "white" }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
          ChuFarm
        </Typography>
        <Typography variant="body2" color="text.secondary">
          เข้าสู่ระบบจัดการฟาร์มอัจฉริยะ
        </Typography>
      </Stack>

      <Divider sx={{ width: "100%", mb: 3 }} />

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          id="email"
          label="อีเมล"
          name="email"
          autoComplete="email"
          autoFocus
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          name="password"
          label="รหัสผ่าน"
          type={showPassword ? "text" : "password"}
          id="password"
          autoComplete="current-password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          error={!!errors.password}
          helperText={errors.password}
          sx={{ mb: 1 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
            }
            label={<Typography variant="body2">จดจำฉัน</Typography>}
          />
          <Button
            size="small"
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            ลืมรหัสผ่าน?
          </Button>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2, mt: -1.5 }}>
          <Button
            size="small"
            onClick={() => navigate(ROUTES.REGISTER)}
            sx={{ textTransform: "none", color: "text.secondary" }}
          >
            ยังไม่มีบัญชี? สมัครสมาชิก
          </Button>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ py: 1.3, fontSize: "1rem" }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "เข้าสู่ระบบ"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
