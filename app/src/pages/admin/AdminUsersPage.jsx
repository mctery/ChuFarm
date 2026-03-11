import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
  InputAdornment,
  Alert,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import MenuIcon from "@mui/icons-material/Menu";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useSnackbar } from "notistack";
import apiClient from "../../services/apiClient";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";
import AdminSearchBar from "../../components/admin/AdminSearchBar";
import { useDialogState } from "../../hooks/useDialogState";
import BulkActionBar from "../../components/admin/BulkActionBar";
import { exportToCSV } from "../../utils/csvExport";

const USER_CSV_COLUMNS = [
  { key: "first_name", label: "ชื่อ" },
  { key: "last_name", label: "นามสกุล" },
  { key: "email", label: "อีเมล" },
  { key: "role", label: "บทบาท" },
  { key: "status", label: "สถานะ" },
];

const EMPTY_CREATE_FORM = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  role: "user",
};

const EMPTY_CREATE_ERRORS = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
};

export default function AdminUsersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Permission dialog state
  const [permDialog, setPermDialog] = useState({ open: false, user: null });
  const [permGroups, setPermGroups] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);

  // Menu dialog state
  const [menuDialog, setMenuDialog] = useState({ open: false, user: null });
  const [allMenus, setAllMenus] = useState([]);
  const [userMenuIds, setUserMenuIds] = useState([]);
  const [savingMenus, setSavingMenus] = useState(false);

  // Create dialog state
  const createDialog = useDialogState();
  const editDialog = useDialogState();
  const deleteDialog = useDialogState();
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createErrors, setCreateErrors] = useState(EMPTY_CREATE_ERRORS);
  const [createLoading, setCreateLoading] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  // Edit dialog state
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    status: "A",
  });
  const [editErrors, setEditErrors] = useState({});
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: pagination.limit };
      if (search) params.search = search;
      const { data } = await apiClient.get("/api/admin/users", { params });
      setUsers(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total }));
    } catch (err) {
      enqueueSnackbar("โหลดข้อมูลผู้ใช้ไม่สำเร็จ", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, enqueueSnackbar]);

  const fetchPermGroups = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/admin/permissions");
      setPermGroups(data.data);
    } catch (err) {
      console.error("fetchPermGroups failed:", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchPermGroups();
  }, [fetchPermGroups]);

  // Search
  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  // Selection helpers
  const allSelected = users.length > 0 && users.every((u) => selectedIds.includes(u._id));
  const someSelected = !allSelected && users.some((u) => selectedIds.includes(u._id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !users.map((u) => u._id).includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...users.map((u) => u._id)])]);
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleBulkExport() {
    const selected = users.filter((u) => selectedIds.includes(u._id));
    exportToCSV(selected, USER_CSV_COLUMNS, "users_export");
    enqueueSnackbar(`ส่งออก ${selected.length} รายการสำเร็จ`, { variant: "success" });
  }

  async function handleBulkDelete() {
    try {
      await apiClient.delete("/api/admin/users/bulk-delete", {
        data: { user_ids: selectedIds },
      });
      enqueueSnackbar(`ลบผู้ใช้ ${selectedIds.length} รายการสำเร็จ`, { variant: "success" });
      setSelectedIds([]);
      fetchUsers();
    } catch (err) {
      console.error("handleBulkDelete failed:", err);
      enqueueSnackbar("ลบผู้ใช้ไม่สำเร็จ", { variant: "error" });
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role: newRole });
      enqueueSnackbar("เปลี่ยน Role สำเร็จ", { variant: "success" });
      fetchUsers();
    } catch (err) {
      console.error("handleRoleChange failed:", err);
      enqueueSnackbar("เปลี่ยน Role ไม่สำเร็จ", { variant: "error" });
    }
  };

  // Permission dialog handlers
  const openPermDialog = async (user) => {
    try {
      const { data } = await apiClient.get(`/api/admin/users/${user._id}/permissions`);
      setUserPermissions(data.data.permissions || []);
      setPermDialog({ open: true, user });
    } catch (err) {
      console.error("openPermDialog failed:", err);
      enqueueSnackbar("โหลดสิทธิ์ไม่สำเร็จ", { variant: "error" });
    }
  };

  const handlePermToggle = (permKey) => {
    setUserPermissions((prev) =>
      prev.includes(permKey) ? prev.filter((p) => p !== permKey) : [...prev, permKey]
    );
  };

  const handleGroupToggleAll = (groupPerms) => {
    const allChecked = groupPerms.every((p) => userPermissions.includes(p));
    if (allChecked) {
      setUserPermissions((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setUserPermissions((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  };

  const savePermissions = async () => {
    if (!permDialog.user) return;
    setSavingPerms(true);
    try {
      await apiClient.put(`/api/admin/users/${permDialog.user._id}/permissions`, {
        permissions: userPermissions,
      });
      enqueueSnackbar("บันทึกสิทธิ์สำเร็จ", { variant: "success" });
      setPermDialog({ open: false, user: null });
    } catch (err) {
      console.error("savePermissions failed:", err);
      enqueueSnackbar("บันทึกสิทธิ์ไม่สำเร็จ", { variant: "error" });
    } finally {
      setSavingPerms(false);
    }
  };

  // Create dialog handlers
  const openCreateDialog = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setCreateErrors(EMPTY_CREATE_ERRORS);
    setShowCreatePassword(false);
    createDialog.open();
  };

  const closeCreateDialog = createDialog.close;

  const validateCreateForm = () => {
    const errors = {};
    if (!createForm.first_name.trim()) errors.first_name = "กรุณากรอกชื่อ";
    if (!createForm.last_name.trim()) errors.last_name = "กรุณากรอกนามสกุล";
    if (!createForm.email.trim()) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    if (!createForm.password) {
      errors.password = "กรุณากรอกรหัสผ่าน";
    } else if (createForm.password.length < 8) {
      errors.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    }
    return errors;
  };

  const handleCreateSubmit = async () => {
    const errors = validateCreateForm();
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }
    setCreateLoading(true);
    try {
      await apiClient.post("/api/admin/users", {
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role,
      });
      enqueueSnackbar("สร้างผู้ใช้สำเร็จ", { variant: "success" });
      closeCreateDialog();
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 409) {
        enqueueSnackbar("อีเมลนี้ถูกใช้งานแล้ว", { variant: "error" });
      } else {
        enqueueSnackbar("สร้างผู้ใช้ไม่สำเร็จ", { variant: "error" });
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Edit dialog handlers
  const openEditDialog = (user) => {
    setEditForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      status: user.status || "A",
    });
    setEditErrors({});
    editDialog.open(user);
  };

  const closeEditDialog = editDialog.close;

  const validateEditForm = () => {
    const errors = {};
    if (!editForm.first_name.trim()) errors.first_name = "กรุณากรอกชื่อ";
    if (!editForm.last_name.trim()) errors.last_name = "กรุณากรอกนามสกุล";
    if (!editForm.email.trim()) {
      errors.email = "กรุณากรอกอีเมล";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      errors.email = "รูปแบบอีเมลไม่ถูกต้อง";
    }
    return errors;
  };

  const handleEditSubmit = async () => {
    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    if (!editDialog.state.item) return;
    setEditLoading(true);
    try {
      await apiClient.put(`/api/admin/users/${editDialog.state.item._id}`, {
        first_name: editForm.first_name.trim(),
        last_name: editForm.last_name.trim(),
        email: editForm.email.trim(),
        status: editForm.status,
      });
      enqueueSnackbar("แก้ไขข้อมูลสำเร็จ", { variant: "success" });
      closeEditDialog();
      fetchUsers();
    } catch (err) {
      if (err.response?.status === 409) {
        enqueueSnackbar("อีเมลนี้ถูกใช้งานแล้ว", { variant: "error" });
      } else {
        enqueueSnackbar("แก้ไขข้อมูลไม่สำเร็จ", { variant: "error" });
      }
    } finally {
      setEditLoading(false);
    }
  };

  // Menu dialog handlers
  const openMenuDialog = async (user) => {
    try {
      const [menusRes, userMenusRes] = await Promise.all([
        apiClient.get("/api/admin/menus"),
        apiClient.get(`/api/admin/users/${user._id}/menus`),
      ]);
      setAllMenus(menusRes.data.data || []);
      setUserMenuIds(userMenusRes.data.data.menu_ids || []);
      setMenuDialog({ open: true, user });
    } catch {
      enqueueSnackbar("โหลดข้อมูลเมนูไม่สำเร็จ", { variant: "error" });
    }
  };

  const handleMenuToggle = (menuId) => {
    setUserMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId]
    );
  };

  const saveMenus = async () => {
    if (!menuDialog.user) return;
    setSavingMenus(true);
    try {
      await apiClient.put(`/api/admin/users/${menuDialog.user._id}/menus`, { menu_ids: userMenuIds });
      enqueueSnackbar("บันทึกเมนูสำเร็จ", { variant: "success" });
      setMenuDialog({ open: false, user: null });
    } catch {
      enqueueSnackbar("บันทึกเมนูไม่สำเร็จ", { variant: "error" });
    } finally {
      setSavingMenus(false);
    }
  };

  // Delete dialog handlers
  const openDeleteDialog = (user) => deleteDialog.open(user);
  const closeDeleteDialog = deleteDialog.close;

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.state.item) return;
    setDeleteLoading(true);
    try {
      await apiClient.delete(`/api/admin/users/${deleteDialog.state.item._id}`);
      enqueueSnackbar("ลบผู้ใช้สำเร็จ", { variant: "success" });
      closeDeleteDialog();
      fetchUsers();
    } catch (err) {
      console.error("handleDeleteConfirm failed:", err);
      enqueueSnackbar("ลบผู้ใช้ไม่สำเร็จ", { variant: "error" });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <AdminPageWrapper title="จัดการผู้ใช้งาน">
      {/* Toolbar row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          เพิ่มผู้ใช้
        </Button>

        <AdminSearchBar placeholder="ค้นหาชื่อ, อีเมล..." onSearch={handleSearch} />
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleSelectAll}
                />
              </TableCell>
              <TableCell>ชื่อ</TableCell>
              <TableCell>อีเมล</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">สถานะ</TableCell>
              <TableCell align="center">สิทธิ์</TableCell>
              <TableCell align="center">เมนู</TableCell>
              <TableCell align="center">การดำเนินการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user._id}
                hover
                selected={selectedIds.includes(user._id)}
                onClick={() => toggleSelectOne(user._id)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(user._id)}
                    onChange={() => toggleSelectOne(user._id)}
                  />
                </TableCell>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Select
                    size="small"
                    value={user.role || "user"}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    sx={{ minWidth: 100 }}
                  >
                    <MenuItem value="admin">ผู้ดูแลระบบ</MenuItem>
                    <MenuItem value="user">ผู้ใช้งาน</MenuItem>
                  </Select>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.status === "A" ? "ใช้งาน" : "ปิดใช้"}
                    color={user.status === "A" ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openPermDialog(user)}
                    title="แก้ไขสิทธิ์"
                  >
                    <SecurityIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => openMenuDialog(user)}
                    title="จัดการเมนู"
                  >
                    <MenuIcon />
                  </IconButton>
                </TableCell>
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    size="small"
                    color="default"
                    onClick={() => openEditDialog(user)}
                    title="แก้ไขข้อมูล"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => openDeleteDialog(user)}
                    title="ลบผู้ใช้"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  ไม่พบผู้ใช้
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page - 1}
          onPageChange={(_, newPage) =>
            setPagination((prev) => ({ ...prev, page: newPage + 1 }))
          }
          rowsPerPage={pagination.limit}
          onRowsPerPageChange={(e) =>
            setPagination((prev) => ({
              ...prev,
              limit: parseInt(e.target.value, 10),
              page: 1,
            }))
          }
          rowsPerPageOptions={[10, 20, 50]}
          labelRowsPerPage="แสดง:"
        />
      </TableContainer>

      {/* Permission Dialog */}
      <Dialog
        open={permDialog.open}
        onClose={() => setPermDialog({ open: false, user: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <SecurityIcon color="primary" />
            จัดการสิทธิ์ — {permDialog.user?.first_name} {permDialog.user?.last_name}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {userPermissions.includes("*") && (
            <Alert severity="info" sx={{ mb: 2 }}>
              ผู้ใช้นี้มีสิทธิ์ Wildcard (*) — สามารถเข้าถึงทุกส่วนของระบบ
            </Alert>
          )}
          {permGroups.map((group) => {
            const allChecked = group.permissions.every((p) =>
              userPermissions.includes(p)
            );
            const someChecked =
              !allChecked &&
              group.permissions.some((p) => userPermissions.includes(p));

            return (
              <Box key={group.key} sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={() => handleGroupToggleAll(group.permissions)}
                    />
                  }
                  label={
                    <Typography variant="subtitle1" fontWeight={600}>
                      {group.label}
                    </Typography>
                  }
                />
                <FormGroup row sx={{ pl: 4 }}>
                  {group.permissions.map((perm) => (
                    <FormControlLabel
                      key={perm}
                      control={
                        <Checkbox
                          size="small"
                          checked={userPermissions.includes(perm)}
                          onChange={() => handlePermToggle(perm)}
                        />
                      }
                      label={perm}
                    />
                  ))}
                </FormGroup>
                <Divider sx={{ mt: 1 }} />
              </Box>
            );
          })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialog({ open: false, user: null })}>
            ยกเลิก
          </Button>
          <Button variant="contained" onClick={savePermissions} disabled={savingPerms}>
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog
        open={createDialog.state.open}
        onClose={closeCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="ชื่อ"
                size="small"
                fullWidth
                required
                value={createForm.first_name}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, first_name: e.target.value }));
                  if (createErrors.first_name)
                    setCreateErrors((prev) => ({ ...prev, first_name: "" }));
                }}
                error={Boolean(createErrors.first_name)}
                helperText={createErrors.first_name}
              />
              <TextField
                label="นามสกุล"
                size="small"
                fullWidth
                required
                value={createForm.last_name}
                onChange={(e) => {
                  setCreateForm((prev) => ({ ...prev, last_name: e.target.value }));
                  if (createErrors.last_name)
                    setCreateErrors((prev) => ({ ...prev, last_name: "" }));
                }}
                error={Boolean(createErrors.last_name)}
                helperText={createErrors.last_name}
              />
            </Box>
            <TextField
              label="อีเมล"
              size="small"
              fullWidth
              required
              type="email"
              value={createForm.email}
              onChange={(e) => {
                setCreateForm((prev) => ({ ...prev, email: e.target.value }));
                if (createErrors.email)
                  setCreateErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={Boolean(createErrors.email)}
              helperText={createErrors.email}
            />
            <TextField
              label="รหัสผ่าน"
              size="small"
              fullWidth
              required
              type={showCreatePassword ? "text" : "password"}
              value={createForm.password}
              onChange={(e) => {
                setCreateForm((prev) => ({ ...prev, password: e.target.value }));
                if (createErrors.password)
                  setCreateErrors((prev) => ({ ...prev, password: "" }));
              }}
              error={Boolean(createErrors.password)}
              helperText={createErrors.password || "อย่างน้อย 8 ตัวอักษร"}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowCreatePassword((prev) => !prev)}
                        edge="end"
                      >
                        {showCreatePassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>บทบาท</InputLabel>
              <Select
                label="บทบาท"
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, role: e.target.value }))
                }
              >
                <MenuItem value="user">ผู้ใช้งาน</MenuItem>
                <MenuItem value="admin">ผู้ดูแลระบบ</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog} disabled={createLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={createLoading}
            startIcon={createLoading ? <CircularProgress size={16} /> : null}
          >
            สร้างผู้ใช้
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialog.state.open}
        onClose={closeEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="ชื่อ"
                size="small"
                fullWidth
                required
                value={editForm.first_name}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, first_name: e.target.value }));
                  if (editErrors.first_name)
                    setEditErrors((prev) => ({ ...prev, first_name: "" }));
                }}
                error={Boolean(editErrors.first_name)}
                helperText={editErrors.first_name}
              />
              <TextField
                label="นามสกุล"
                size="small"
                fullWidth
                required
                value={editForm.last_name}
                onChange={(e) => {
                  setEditForm((prev) => ({ ...prev, last_name: e.target.value }));
                  if (editErrors.last_name)
                    setEditErrors((prev) => ({ ...prev, last_name: "" }));
                }}
                error={Boolean(editErrors.last_name)}
                helperText={editErrors.last_name}
              />
            </Box>
            <TextField
              label="อีเมล"
              size="small"
              fullWidth
              required
              type="email"
              value={editForm.email}
              onChange={(e) => {
                setEditForm((prev) => ({ ...prev, email: e.target.value }));
                if (editErrors.email)
                  setEditErrors((prev) => ({ ...prev, email: "" }));
              }}
              error={Boolean(editErrors.email)}
              helperText={editErrors.email}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>สถานะ</InputLabel>
              <Select
                label="สถานะ"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <MenuItem value="A">Active</MenuItem>
                <MenuItem value="D">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} disabled={editLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            onClick={handleEditSubmit}
            disabled={editLoading}
            startIcon={editLoading ? <CircularProgress size={16} /> : null}
          >
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.state.open}
        onClose={closeDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
        <DialogContent dividers>
          <Typography>
            ต้องการลบผู้ใช้{" "}
            <strong>
              {deleteDialog.state.item?.first_name} {deleteDialog.state.item?.last_name}
            </strong>{" "}
            ใช่หรือไม่?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={deleteLoading}>
            ยกเลิก
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} /> : null}
          >
            ลบผู้ใช้
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu Assignment Dialog */}
      <Dialog open={menuDialog.open} onClose={() => setMenuDialog({ open: false, user: null })} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <MenuIcon color="secondary" />
            จัดการเมนู — {menuDialog.user?.first_name} {menuDialog.user?.last_name}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {allMenus.length === 0 ? (
            <Typography color="text.secondary">ไม่มีเมนูในระบบ</Typography>
          ) : (
            <FormGroup>
              {allMenus.map((menu) => (
                <FormControlLabel
                  key={menu._id}
                  control={
                    <Checkbox
                      size="small"
                      checked={userMenuIds.includes(menu._id)}
                      onChange={() => handleMenuToggle(menu._id)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">{menu.title}</Typography>
                      {menu.path && (
                        <Typography variant="caption" color="text.secondary">{menu.path}</Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMenuDialog({ open: false, user: null })}>ยกเลิก</Button>
          <Button variant="contained" onClick={saveMenus} disabled={savingMenus}>
            {savingMenus ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogActions>
      </Dialog>

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          {
            label: "ส่งออก CSV",
            icon: <FileDownloadIcon fontSize="small" />,
            color: "primary",
            onClick: handleBulkExport,
          },
          {
            label: "ลบที่เลือก",
            icon: <DeleteIcon fontSize="small" />,
            color: "error",
            onClick: handleBulkDelete,
          },
        ]}
      />
    </AdminPageWrapper>
  );
}
