import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Stack,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Pagination,
  alpha,
  useTheme,
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CircleIcon from "@mui/icons-material/Circle";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useSnackbar } from "notistack";
import apiClient from "../services/apiClient";
import { getUserInfo } from "../services/storage_service";
import BoxLoading from "../components/BoxLoading";
import { formatDate } from "../utils/dateFormat";

const SEVERITY_COLORS = {
  critical: "error",
  warning: "warning",
  info: "info",
};

const SEVERITY_LABELS = {
  critical: "สำคัญ",
  warning: "คำเตือน",
  info: "ข้อมูล",
};

const PER_PAGE = 15;

export default function NotificationsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const userId = getUserInfo()?.user_id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0); // 0=all, 1=unread, 2=read
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(
    async (targetPage = 1) => {
      if (!userId) return;
      setLoading(true);
      try {
        const params = { page: targetPage, limit: PER_PAGE };
        if (tab === 1) params.is_read = false;
        else if (tab === 2) params.is_read = true;

        const { data } = await apiClient.get(
          `/api/notifications/user/${userId}`,
          { params }
        );
        setNotifications(data.data || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
        }
      } catch {
        enqueueSnackbar("ไม่สามารถโหลดแจ้งเตือนได้", { variant: "error" });
      }
      setLoading(false);
    },
    [userId, tab]
  );

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await apiClient.get(
        `/api/notifications/user/${userId}/unread-count`
      );
      setUnreadCount(data.data?.count || 0);
    } catch {
      // silent
    }
  }, [userId]);

  useEffect(() => {
    setPage(1);
    fetchNotifications(1);
    fetchUnreadCount();
  }, [tab, fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkRead = async (id) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    try {
      await apiClient.put(`/api/notifications/user/${userId}/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      enqueueSnackbar("อ่านแจ้งเตือนทั้งหมดแล้ว", { variant: "success" });
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      enqueueSnackbar("ลบแจ้งเตือนแล้ว", { variant: "success" });
    } catch {
      enqueueSnackbar("เกิดข้อผิดพลาด", { variant: "error" });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            แจ้งเตือน
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {unreadCount > 0
              ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน`
              : "ไม่มีแจ้งเตือนใหม่"}
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DoneAllIcon />}
            onClick={handleMarkAllRead}
          >
            อ่านทั้งหมด
          </Button>
        )}
      </Stack>

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="ทั้งหมด" />
        <Tab
          label={
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <span>ยังไม่อ่าน</span>
              {unreadCount > 0 && (
                <Chip
                  label={unreadCount}
                  size="small"
                  color="error"
                  sx={{ height: 20, fontSize: "0.7rem" }}
                />
              )}
            </Stack>
          }
        />
        <Tab label="อ่านแล้ว" />
      </Tabs>

      {/* Content */}
      {loading ? (
        <BoxLoading />
      ) : notifications.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            bgcolor: "background.default",
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 3,
          }}
        >
          <NotificationsNoneIcon
            sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            ไม่มีแจ้งเตือน
          </Typography>
          <Typography variant="body2" color="text.disabled">
            {tab === 1
              ? "ไม่มีแจ้งเตือนที่ยังไม่ได้อ่าน"
              : "ยังไม่มีแจ้งเตือนในระบบ"}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1}>
          {notifications.map((n) => (
            <Paper
              key={n._id}
              variant="outlined"
              sx={{
                px: 2.5,
                py: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                bgcolor: n.is_read
                  ? "transparent"
                  : alpha(theme.palette.primary.main, 0.03),
                transition: "background-color 0.2s",
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                },
              }}
            >
              {/* Unread indicator */}
              <Box
                sx={{
                  pt: 0.75,
                  width: 12,
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {!n.is_read && (
                  <CircleIcon
                    sx={{ fontSize: 10, color: "primary.main" }}
                  />
                )}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ mb: 0.5 }}
                >
                  <Typography
                    variant="body1"
                    fontWeight={n.is_read ? 400 : 600}
                    noWrap
                    sx={{ flex: 1 }}
                  >
                    {n.title}
                  </Typography>
                  <Chip
                    label={SEVERITY_LABELS[n.severity] || n.severity || "info"}
                    size="small"
                    color={SEVERITY_COLORS[n.severity] || "default"}
                    sx={{ height: 22, fontSize: "0.7rem" }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.75 }}
                >
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDate(n.createdAt)}
                  {n.type && ` — ${n.type.replace(/_/g, " ")}`}
                </Typography>
              </Box>

              {/* Actions */}
              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                {!n.is_read && (
                  <Tooltip title="ทำเครื่องหมายว่าอ่านแล้ว">
                    <IconButton
                      size="small"
                      onClick={() => handleMarkRead(n._id)}
                    >
                      <DoneAllIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="ลบ">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDelete(n._id)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" pt={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
