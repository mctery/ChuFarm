import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AddIcon from "@mui/icons-material/Add";
import { useSnackbar } from "notistack";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import apiClient from "../../services/apiClient";

export default function AdminMenusPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, menu: null });
  const [form, setForm] = useState({ key: "", name: "", path: "", icon: "", parent_key: "", order: 0 });

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/admin/menus");
      setMenus(data.data);
    } catch {
      enqueueSnackbar("โหลดข้อมูลเมนูไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => { fetchMenus(); }, [fetchMenus]);

  const parentMenus = menus.filter((m) => !m.parent_key);
  const childMenus = (parentKey) => menus.filter((m) => m.parent_key === parentKey).sort((a, b) => a.order - b.order);

  const openCreate = () => {
    setForm({ key: "", name: "", path: "", icon: "", parent_key: "", order: 0 });
    setDialog({ open: true, menu: null });
  };

  const openEdit = (menu) => {
    setForm({
      key: menu.key,
      name: menu.name,
      path: menu.path || "",
      icon: menu.icon || "",
      parent_key: menu.parent_key || "",
      order: menu.order || 0,
    });
    setDialog({ open: true, menu });
  };

  const handleSave = async () => {
    try {
      if (dialog.menu) {
        await apiClient.put(`/api/menus/${dialog.menu._id}`, form);
        enqueueSnackbar("แก้ไขเมนูสำเร็จ", { variant: "success" });
      } else {
        await apiClient.post("/api/menus", form);
        enqueueSnackbar("สร้างเมนูสำเร็จ", { variant: "success" });
      }
      setDialog({ open: false, menu: null });
      fetchMenus();
    } catch {
      enqueueSnackbar("บันทึกเมนูไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันลบเมนูนี้?")) return;
    try {
      await apiClient.delete(`/api/menus/${id}`);
      enqueueSnackbar("ลบเมนูสำเร็จ", { variant: "success" });
      fetchMenus();
    } catch {
      enqueueSnackbar("ลบเมนูไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleReorder = async (menu, direction) => {
    const siblings = menu.parent_key ? childMenus(menu.parent_key) : parentMenus;
    const idx = siblings.findIndex((m) => m._id === menu._id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    try {
      await Promise.all([
        apiClient.put(`/api/menus/${siblings[idx]._id}`, { order: siblings[swapIdx].order }),
        apiClient.put(`/api/menus/${siblings[swapIdx]._id}`, { order: siblings[idx].order }),
      ]);
      fetchMenus();
    } catch {
      enqueueSnackbar("เรียงลำดับไม่สำเร็จ", { variant: "error" });
    }
  };

  return (
    <AdminPageWrapper
      title="จัดการเมนู"
      action={
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openCreate}>
          เพิ่มเมนู
        </Button>
      }
    >
      {parentMenus.sort((a, b) => a.order - b.order).map((parent) => (
        <Card key={parent._id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {parent.name}
                </Typography>
                <Chip label={parent.key} size="small" variant="outlined" />
                {parent.icon && <Chip label={parent.icon} size="small" color="primary" variant="outlined" />}
              </Stack>
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={() => handleReorder(parent, "up")} title="ขึ้น">
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => handleReorder(parent, "down")} title="ลง">
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => openEdit(parent)} title="แก้ไข">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(parent._id)} title="ลบ">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>

            {childMenus(parent.key).length > 0 && <Divider sx={{ my: 1.5 }} />}

            {childMenus(parent.key).map((child) => (
              <Box key={child._id} sx={{ pl: 3, py: 0.5 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{child.name}</Typography>
                    <Chip label={child.path || "—"} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    {child.icon && (
                      <Chip label={child.icon} size="small" color="primary" variant="outlined" sx={{ fontSize: 11 }} />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => handleReorder(child, "up")} title="ขึ้น">
                      <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleReorder(child, "down")} title="ลง">
                      <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => openEdit(child)} title="แก้ไข">
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(child._id)} title="ลบ">
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </CardContent>
        </Card>
      ))}

      {!loading && parentMenus.length === 0 && (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          ไม่มีเมนู
        </Typography>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialog.open} onClose={() => setDialog({ open: false, menu: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog.menu ? "แก้ไขเมนู" : "เพิ่มเมนู"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Key"
              value={form.key}
              onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
              fullWidth
              disabled={!!dialog.menu}
            />
            <TextField
              label="ชื่อเมนู"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Path"
              value={form.path}
              onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
              fullWidth
              placeholder="/admin/example"
            />
            <TextField
              label="Icon"
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              fullWidth
              placeholder="Settings"
            />
            <FormControl fullWidth>
              <InputLabel>Parent</InputLabel>
              <Select
                label="Parent"
                value={form.parent_key}
                onChange={(e) => setForm((f) => ({ ...f, parent_key: e.target.value }))}
              >
                <MenuItem value="">ไม่มี (เป็น root)</MenuItem>
                {parentMenus.map((p) => (
                  <MenuItem key={p.key} value={p.key}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="ลำดับ"
              type="number"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value, 10) || 0 }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog({ open: false, menu: null })}>ยกเลิก</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.key || !form.name}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </AdminPageWrapper>
  );
}
