const express = require('express');
const { verifyToken } = require('../middleware/authorization');
const { requireAdmin } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  updateRoleSchema,
  updatePermissionsSchema,
  updateUserMenusSchema,
  createNotificationSchema,
  updateDeviceSchema,
  updateSensorSchema,
  bulkRoleSchema,
  bulkDeleteUsersSchema,
  bulkDeleteDevicesSchema,
} = require('../validations/adminValidation');
const {
  getAdminUsers,
  getAdminUser,
  updateUserRole,
  getUserPermissions,
  updateUserPermissions,
  getPermissionDefinitions,
  getAdminMenus,
  getUserMenus,
  updateUserMenus,
  getAdminStats,
  getAdminDevices,
  updateAdminDevice,
  deleteAdminDevice,
  getAdminSensors,
  updateAdminSensor,
  deleteAdminSensor,
  getAdminDeviceLogs,
  getAdminNotifications,
  createSystemNotification,
  getSystemInfo,
  bulkUpdateRole,
  bulkDeleteUsers,
  bulkDeleteDevices,
} = require('../controllers/adminController');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(verifyToken);
router.use(requireAdmin);

// Phase 1: Dashboard
router.get('/stats', getAdminStats);

// Phase 8: System info
router.get('/system-info', getSystemInfo);

// Users — bulk operations BEFORE :id routes
router.put('/users/bulk-role', validate(bulkRoleSchema), bulkUpdateRole);
router.delete('/users/bulk-delete', validate(bulkDeleteUsersSchema), bulkDeleteUsers);

// Users
router.get('/users', getAdminUsers);
router.get('/users/:id', getAdminUser);
router.put('/users/:id/role', validate(updateRoleSchema), updateUserRole);
router.get('/users/:id/permissions', getUserPermissions);
router.put('/users/:id/permissions', validate(updatePermissionsSchema), updateUserPermissions);
router.get('/users/:id/menus', getUserMenus);
router.put('/users/:id/menus', validate(updateUserMenusSchema), updateUserMenus);

// Devices — bulk operations BEFORE :id routes
router.delete('/devices/bulk-delete', validate(bulkDeleteDevicesSchema), bulkDeleteDevices);

// Devices
router.get('/devices', getAdminDevices);
router.put('/devices/:id', validate(updateDeviceSchema), updateAdminDevice);
router.delete('/devices/:id', deleteAdminDevice);

// Sensors
router.get('/sensors', getAdminSensors);
router.put('/sensors/:id', validate(updateSensorSchema), updateAdminSensor);
router.delete('/sensors/:id', deleteAdminSensor);

// Device logs
router.get('/device-logs', getAdminDeviceLogs);

// Notifications
router.get('/notifications', getAdminNotifications);
router.post('/notifications', validate(createNotificationSchema), createSystemNotification);

// Permissions & menus
router.get('/permissions', getPermissionDefinitions);
router.get('/menus', getAdminMenus);

module.exports = router;
