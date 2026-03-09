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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import SecurityIcon from "@mui/icons-material/Security";
import { useSnackbar } from "notistack";
import apiClient from "../../services/apiClient";
import AdminPageWrapper from "../../components/admin/AdminPageWrapper";

export default function AdminUsersPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Permission dialog state
  const [permDialog, setPermDialog] = useState({ open: false, user: null });
  const [permGroups, setPermGroups] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [savingPerms, setSavingPerms] = useState(false);

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

  // Search with debounce
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

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

  return (
    <AdminPageWrapper title="จัดการผู้ใช้งาน">
      {/* Search */}
      <TextField
        size="small"
        placeholder="ค้นหาชื่อ, อีเมล..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        sx={{ mb: 2, width: 320 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Users Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ชื่อ</TableCell>
              <TableCell>อีเมล</TableCell>
              <TableCell align="center">Role</TableCell>
              <TableCell align="center">สถานะ</TableCell>
              <TableCell align="center">สิทธิ์</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id} hover>
                <TableCell>
                  {user.first_name} {user.last_name}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell align="center">
                  <Select
                    size="small"
                    value={user.role || "user"}
                    onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    sx={{ minWidth: 100 }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                  </Select>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={user.status === "A" ? "Active" : "Inactive"}
                    color={user.status === "A" ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => openPermDialog(user)}
                    title="แก้ไขสิทธิ์"
                  >
                    <SecurityIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
    </AdminPageWrapper>
  );
}
