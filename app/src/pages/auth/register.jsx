import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Button,
  TextField,
  Typography,
  Divider,
  Box,
  Stack,
  CircularProgress,
  IconButton,
  InputAdornment,
  LinearProgress,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { SysRegister } from "../../services/auth_service";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AuthLayout from "../../components/AuthLayout";
import { ROUTES } from "../../constants/routes";
import { VALIDATION } from "../../services/global_variable";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= VALIDATION.minPasswordLength) score++;
  if (password.length >= 12) score++;
  if (VALIDATION.uppercaseRegex.test(password)) score++;
  if (VALIDATION.numberRegex.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-5
}

const STRENGTH_LABELS = ["", "อ่อนมาก", "อ่อน", "ปานกลาง", "แข็งแรง", "แข็งแรงมาก"];
const STRENGTH_COLORS = ["", "error", "error", "warning", "success", "success"];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    password_confirm: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const strength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const rules = useMemo(() => {
    const pw = formData.password;
    return [
      { label: `อย่างน้อย ${VALIDATION.minPasswordLength} ตัวอักษร`, pass: pw.length >= VALIDATION.minPasswordLength },
      { label: "มีตัวพิมพ์ใหญ่", pass: VALIDATION.uppercaseRegex.test(pw) },
      { label: "มีตัวเลข", pass: VALIDATION.numberRegex.test(pw) },
    ];
  }, [formData.password]);

  const validateForm = () => {
    const { name, surname, email, password, password_confirm } = formData;

    if (!name.trim() || !surname.trim()) {
      enqueueSnackbar("กรุณากรอกชื่อและนามสกุล", { variant: "error" });
      return false;
    }

    if (!VALIDATION.emailRegex.test(email)) {
      enqueueSnackbar("รูปแบบอีเมลไม่ถูกต้อง", { variant: "error" });
      return false;
    }

    if (password.length < VALIDATION.minPasswordLength) {
      enqueueSnackbar(`รหัสผ่านต้องมีอย่างน้อย ${VALIDATION.minPasswordLength} ตัวอักษร`, {
        variant: "error",
      });
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
    const res = await SysRegister(
      formData.name,
      formData.surname,
      formData.email,
      formData.password
    );
    setLoading(false);

    if (res) {
      enqueueSnackbar("สมัครสมาชิกเรียบร้อยแล้ว", { variant: "success" });
      navigate(ROUTES.LOGIN);
    } else {
      enqueueSnackbar("อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น", {
        variant: "error",
      });
    }
  };

  const passwordToggle = (
    <InputAdornment position="end">
      <IconButton
        size="small"
        onClick={() => setShowPassword((prev) => !prev)}
        edge="end"
      >
        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <AuthLayout layout="split" maxWidth={440}>
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
          <PersonAddAltIcon sx={{ fontSize: 30, color: "white" }} />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
          สมัครสมาชิก
        </Typography>
        <Typography variant="body2" color="text.secondary">
          สร้างบัญชีเพื่อเริ่มใช้งานระบบฟาร์มอัจฉริยะ
        </Typography>
      </Stack>

      <Divider sx={{ width: "100%", mb: 2 }} />

      <form onSubmit={handleSubmit} style={{ width: "100%" }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          ข้อมูลส่วนตัว
        </Typography>

        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
          <TextField
            size="small"
            required
            fullWidth
            label="ชื่อ"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
          />
          <TextField
            size="small"
            required
            fullWidth
            label="นามสกุล"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
            disabled={loading}
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={600}
          sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
        >
          ข้อมูลสำหรับเข้าสู่ระบบ
        </Typography>

        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          label="อีเมล"
          name="email"
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
        />
        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          label="รหัสผ่าน"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          slotProps={{
            input: { endAdornment: passwordToggle },
          }}
        />

        {/* Password strength */}
        {formData.password && (
          <Box sx={{ mt: 1, mb: 0.5 }}>
            <LinearProgress
              variant="determinate"
              value={(strength / 5) * 100}
              color={STRENGTH_COLORS[strength] || "primary"}
              sx={{ height: 4, borderRadius: 2 }}
            />
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 0.5 }}
            >
              <Typography variant="caption" color="text.secondary">
                ความแข็งแรง: {STRENGTH_LABELS[strength]}
              </Typography>
            </Stack>
            <Stack spacing={0.25} sx={{ mt: 0.5 }}>
              {rules.map((r) => (
                <Stack
                  key={r.label}
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                >
                  <CheckCircleOutlineIcon
                    sx={{
                      fontSize: 14,
                      color: r.pass ? "success.main" : "text.disabled",
                    }}
                  />
                  <Typography
                    variant="caption"
                    color={r.pass ? "success.main" : "text.disabled"}
                  >
                    {r.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        <TextField
          size="small"
          margin="normal"
          required
          fullWidth
          label="ยืนยันรหัสผ่าน"
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          value={formData.password_confirm}
          onChange={handleChange}
          disabled={loading}
          error={
            formData.password_confirm.length > 0 &&
            formData.password !== formData.password_confirm
          }
          helperText={
            formData.password_confirm.length > 0 &&
            formData.password !== formData.password_confirm
              ? "รหัสผ่านไม่ตรงกัน"
              : ""
          }
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
            "สมัครสมาชิก"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
