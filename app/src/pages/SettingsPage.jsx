import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  TextField,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import SaveIcon from "@mui/icons-material/Save";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useSnackbar } from "notistack";
import apiClient from "../services/apiClient";
import { getUserInfo } from "../services/storage_service";
import BoxLoading from "../components/BoxLoading";

export default function SettingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const userInfo = getUserInfo();
  const userId = userInfo?.user_id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
  });

  // Password
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    password_confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    notification: { email: false, push: false, in_app: true, line: false },
    quiet_hours: { enabled: false, start: "22:00", end: "06:00" },
    dashboard: { refresh_interval: 30 },
    line_token: "",
  });

  // LINE
  const [lineToken, setLineToken] = useState("");
  const [lineConnected, setLineConnected] = useState(false);
  const [testingLine, setTestingLine] = useState(false);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileRes, settingsRes] = await Promise.all([
        apiClient.get("/api/users/me"),
        apiClient.get(`/api/settings/${userId}`),
      ]);
      const p = profileRes.data.data;
      setProfile({ first_name: p.first_name || "", last_name: p.last_name || "" });

      const s = settingsRes.data.data;
      setSettings({
        notification: s.notification || { email: false, push: false, in_app: true, line: false },
        quiet_hours: s.quiet_hours || { enabled: false, start: "22:00", end: "06:00" },
        dashboard: s.dashboard || { refresh_interval: 30 },
        line_token: s.line_token || "",
      });
      setLineConnected(!!s.line_token);
    } catch {
      enqueueSnackbar("โหลดข้อมูลไม่สำเร็จ", { variant: "error" });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiClient.put("/api/users/me", profile);
      enqueueSnackbar("บันทึกข้อมูลโปรไฟล์แล้ว", { variant: "success" });
    } catch {
      enqueueSnackbar("บันทึกไม่สำเร็จ", { variant: "error" });
    }
    setSaving(false);
  };

  const handleSavePassword = async () => {
    if (passwordForm.password.length < 8) {
      enqueueSnackbar("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", { variant: "error" });
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirm) {
      enqueueSnackbar("รหัสผ่านไม่ตรงกัน", { variant: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      await apiClient.put("/api/users/me", { password: passwordForm.password });
      enqueueSnackbar("เปลี่ยนรหัสผ่านแล้ว", { variant: "success" });
      setPasswordForm({ password: "", password_confirm: "" });
    } catch {
      enqueueSnackbar("เปลี่ยนรหัสผ่านไม่สำเร็จ", { variant: "error" });
    }
    setSavingPassword(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/api/settings/${userId}`, {
        notification: settings.notification,
        quiet_hours: settings.quiet_hours,
        dashboard: settings.dashboard,
      });
      enqueueSnackbar("บันทึกการตั้งค่าแล้ว", { variant: "success" });
    } catch {
      enqueueSnackbar("บันทึกไม่สำเร็จ", { variant: "error" });
    }
    setSaving(false);
  };

  const handleConnectLine = async () => {
    if (!lineToken.trim()) {
      enqueueSnackbar("กรุณากรอก LINE Notify Token", { variant: "error" });
      return;
    }
    setTestingLine(true);
    try {
      await apiClient.post(`/api/settings/${userId}/line/connect`, {
        token: lineToken,
      });
      enqueueSnackbar("เชื่อมต่อ LINE Notify สำเร็จ", { variant: "success" });
      setLineConnected(true);
      setLineToken("");
    } catch {
      enqueueSnackbar("เชื่อมต่อไม่สำเร็จ ตรวจสอบ Token อีกครั้ง", { variant: "error" });
    }
    setTestingLine(false);
  };

  const handleDisconnectLine = async () => {
    try {
      await apiClient.delete(`/api/settings/${userId}/line/disconnect`);
      enqueueSnackbar("ยกเลิกการเชื่อมต่อ LINE Notify แล้ว", { variant: "success" });
      setLineConnected(false);
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    }
  };

  const handleTestLine = async () => {
    setTestingLine(true);
    try {
      await apiClient.post(`/api/settings/${userId}/line/test`);
      enqueueSnackbar("ส่งข้อความทดสอบแล้ว ตรวจสอบที่ LINE", { variant: "success" });
    } catch {
      enqueueSnackbar("ส่งข้อความทดสอบไม่สำเร็จ", { variant: "error" });
    }
    setTestingLine(false);
  };

  const updateNotif = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      notification: { ...prev.notification, [key]: value },
    }));
  };

  if (loading) return <BoxLoading />;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>
        ตั้งค่า
      </Typography>

      <Stack spacing={3}>
        {/* Profile Section */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <PersonIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                ข้อมูลโปรไฟล์
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ชื่อ"
                  fullWidth
                  size="small"
                  value={profile.first_name}
                  onChange={(e) => setProfile((p) => ({ ...p, first_name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="นามสกุล"
                  fullWidth
                  size="small"
                  value={profile.last_name}
                  onChange={(e) => setProfile((p) => ({ ...p, last_name: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="อีเมล"
                  fullWidth
                  size="small"
                  value={userInfo?.email || ""}
                  disabled
                  helperText="ไม่สามารถเปลี่ยนอีเมลได้"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ height: "100%" }}>
                  <Chip
                    label={userInfo?.role === "admin" ? "Admin" : "User"}
                    color={userInfo?.role === "admin" ? "primary" : "default"}
                    size="small"
                  />
                </Stack>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveProfile}
                disabled={saving}
              >
                บันทึกโปรไฟล์
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <SettingsIcon color="warning" />
              <Typography variant="h6" fontWeight={600}>
                เปลี่ยนรหัสผ่าน
              </Typography>
            </Stack>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="รหัสผ่านใหม่"
                  fullWidth
                  size="small"
                  type={showPassword ? "text" : "password"}
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword((v) => !v)} edge="end">
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="ยืนยันรหัสผ่านใหม่"
                  fullWidth
                  size="small"
                  type="password"
                  value={passwordForm.password_confirm}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, password_confirm: e.target.value }))}
                  error={
                    passwordForm.password_confirm.length > 0 &&
                    passwordForm.password !== passwordForm.password_confirm
                  }
                  helperText={
                    passwordForm.password_confirm.length > 0 &&
                    passwordForm.password !== passwordForm.password_confirm
                      ? "รหัสผ่านไม่ตรงกัน"
                      : ""
                  }
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                size="small"
                color="warning"
                onClick={handleSavePassword}
                disabled={savingPassword || !passwordForm.password}
              >
                {savingPassword ? <CircularProgress size={20} /> : "เปลี่ยนรหัสผ่าน"}
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <NotificationsIcon color="info" />
              <Typography variant="h6" fontWeight={600}>
                การแจ้งเตือน
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notification.in_app}
                    onChange={(e) => updateNotif("in_app", e.target.checked)}
                  />
                }
                label="แจ้งเตือนในแอป"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notification.email}
                    onChange={(e) => updateNotif("email", e.target.checked)}
                  />
                }
                label="แจ้งเตือนทางอีเมล"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notification.line}
                    onChange={(e) => updateNotif("line", e.target.checked)}
                  />
                }
                label="แจ้งเตือนผ่าน LINE Notify"
              />
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Quiet Hours */}
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
              ช่วงเวลาปิดแจ้งเตือน (Quiet Hours)
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.quiet_hours.enabled}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      quiet_hours: { ...prev.quiet_hours, enabled: e.target.checked },
                    }))
                  }
                />
              }
              label="เปิดใช้งาน Quiet Hours"
            />
            {settings.quiet_hours.enabled && (
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <TextField
                  label="เริ่ม"
                  type="time"
                  size="small"
                  value={settings.quiet_hours.start}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      quiet_hours: { ...prev.quiet_hours, start: e.target.value },
                    }))
                  }
                  sx={{ width: 150 }}
                />
                <TextField
                  label="สิ้นสุด"
                  type="time"
                  size="small"
                  value={settings.quiet_hours.end}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      quiet_hours: { ...prev.quiet_hours, end: e.target.value },
                    }))
                  }
                  sx={{ width: 150 }}
                />
              </Stack>
            )}

            <Box sx={{ mt: 2, textAlign: "right" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
                disabled={saving}
              >
                บันทึกการตั้งค่า
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* LINE Notify */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                LINE Notify
              </Typography>
              <Chip
                label={lineConnected ? "เชื่อมต่อแล้ว" : "ยังไม่ได้เชื่อมต่อ"}
                color={lineConnected ? "success" : "default"}
                size="small"
              />
            </Stack>

            {lineConnected ? (
              <Stack spacing={2}>
                <Alert severity="success">
                  LINE Notify เชื่อมต่ออยู่ คุณจะได้รับแจ้งเตือนผ่าน LINE เมื่อมีเหตุการณ์สำคัญ
                </Alert>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleTestLine}
                    disabled={testingLine}
                  >
                    {testingLine ? <CircularProgress size={20} /> : "ส่งข้อความทดสอบ"}
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleDisconnectLine}
                  >
                    ยกเลิกการเชื่อมต่อ
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  กรอก LINE Notify Token เพื่อรับแจ้งเตือนผ่าน LINE
                </Typography>
                <TextField
                  label="LINE Notify Token"
                  fullWidth
                  size="small"
                  value={lineToken}
                  onChange={(e) => setLineToken(e.target.value)}
                  placeholder="paste token here"
                />
                <Box>
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={handleConnectLine}
                    disabled={testingLine || !lineToken.trim()}
                  >
                    {testingLine ? <CircularProgress size={20} /> : "เชื่อมต่อ"}
                  </Button>
                </Box>
              </Stack>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
