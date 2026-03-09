const mongoose = require('mongoose');
const User = require('../models/userModel');
const Permission = require('../models/permissionModel');
const Menu = require('../models/menuModel');
const UserMenu = require('../models/userMenuModel');
const Device = require('../models/deviceModel');
const Sensor = require('../models/sensorModel');
const Notification = require('../models/notificationModel');
const DeviceLog = require('../models/deviceLogModel');
const AuditLog = require('../models/auditLogModel');
const asyncHandler = require('express-async-handler');
const { PERMISSION_GROUPS, DEFAULT_USER_PERMISSIONS } = require('../config/permissions');
const getUserId = require('../utils/getUserId');
const logger = require('../config/logger');
const { STATUS, QUERY_LIMITS } = require('../config');
const { parsePagination, paginationMeta } = require('../utils/pagination');

const getAdminUsers = asyncHandler(async (req, res) => {
  logger.debug('getAdminUsers called');
  const { search, page = 1, limit = QUERY_LIMITS.default } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(QUERY_LIMITS.adminUsersMax, Math.max(1, parseInt(limit, 10) || QUERY_LIMITS.default));

  const filter = { status: STATUS.ACTIVE };
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ first_name: regex }, { last_name: regex }, { email: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  res.json({
    message: 'OK',
    data: users,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

const getAdminUser = asyncHandler(async (req, res) => {
  logger.debug('getAdminUser called');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${req.params.id}`);
  }

  const userId = getUserId(user);
  const permDoc = await Permission.findOne({ user_id: userId });
  const permissions = permDoc ? permDoc.permissions : [];

  res.json({ message: 'OK', data: { ...user.toObject(), permissions } });
});

const updateUserRole = asyncHandler(async (req, res) => {
  logger.debug('updateUserRole called');
  const { id } = req.params;
  const { role } = req.body;

  const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${id}`);
  }

  if (role === 'admin') {
    const userId = getUserId(user);
    await Permission.findOneAndUpdate(
      { user_id: userId },
      { permissions: ['*'] },
      { upsert: true, new: true }
    );
  }

  res.json({ message: 'OK', data: user });
});

const getUserPermissions = asyncHandler(async (req, res) => {
  logger.debug('getUserPermissions called');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${req.params.id}`);
  }

  const userId = getUserId(user);
  const permDoc = await Permission.findOne({ user_id: userId });
  const permissions = permDoc ? permDoc.permissions : DEFAULT_USER_PERMISSIONS;

  res.json({ message: 'OK', data: { user_id: userId, permissions } });
});

const updateUserPermissions = asyncHandler(async (req, res) => {
  logger.debug('updateUserPermissions called');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${req.params.id}`);
  }

  const userId = getUserId(user);
  const { permissions } = req.body;

  const permDoc = await Permission.findOneAndUpdate(
    { user_id: userId },
    { permissions },
    { upsert: true, new: true }
  );

  res.json({ message: 'OK', data: { user_id: userId, permissions: permDoc.permissions } });
});

const getPermissionDefinitions = asyncHandler(async (req, res) => {
  logger.debug('getPermissionDefinitions called');
  res.json({ message: 'OK', data: PERMISSION_GROUPS });
});

const getAdminMenus = asyncHandler(async (req, res) => {
  logger.debug('getAdminMenus called');
  const menus = await Menu.find({ status: STATUS.ACTIVE }).sort({ order: 1 });
  res.json({ message: 'OK', data: menus });
});

const getUserMenus = asyncHandler(async (req, res) => {
  logger.debug('getUserMenus called');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${req.params.id}`);
  }

  const userId = getUserId(user);
  const userMenu = await UserMenu.findOne({ user_id: userId });
  const menu_ids = userMenu ? userMenu.menu_ids : [];

  res.json({ message: 'OK', data: { user_id: userId, menu_ids } });
});

const updateUserMenus = asyncHandler(async (req, res) => {
  logger.debug('updateUserMenus called');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${req.params.id}`);
  }

  const userId = getUserId(user);
  const { menu_ids } = req.body;

  if (menu_ids.length > 0) {
    const existingCount = await Menu.countDocuments({ _id: { $in: menu_ids }, status: STATUS.ACTIVE });
    if (existingCount !== menu_ids.length) {
      res.status(400);
      throw new Error('One or more menu_ids are invalid or refer to inactive menus');
    }
  }

  const userMenu = await UserMenu.findOneAndUpdate(
    { user_id: userId },
    { menu_ids },
    { upsert: true, new: true }
  );

  res.json({ message: 'OK', data: { user_id: userId, menu_ids: userMenu.menu_ids } });
});

// ─── Phase 1: Admin Dashboard Stats ─────────────────────────────────────────
const getAdminStats = asyncHandler(async (req, res) => {
  logger.debug('getAdminStats called');

  const [userCount, deviceCount, sensorCount, notificationCount, recentAuditLogs, recentNotifications] =
    await Promise.all([
      User.countDocuments({ status: STATUS.ACTIVE }),
      Device.countDocuments({ status: STATUS.ACTIVE }),
      Sensor.countDocuments({ status: STATUS.ACTIVE }),
      Notification.countDocuments({ status: STATUS.ACTIVE }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      Notification.find({ status: STATUS.ACTIVE }).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

  const onlineDevices = await Device.countDocuments({ status: STATUS.ACTIVE, online_status: true });

  res.json({
    message: 'OK',
    data: {
      users: userCount,
      devices: deviceCount,
      onlineDevices,
      sensors: sensorCount,
      notifications: notificationCount,
      recentAuditLogs,
      recentNotifications,
    },
  });
});

// ─── Phase 2: Admin Device Management ───────────────────────────────────────
const getAdminDevices = asyncHandler(async (req, res) => {
  logger.debug('getAdminDevices called');
  const { search, online_status, page = 1, limit = QUERY_LIMITS.default } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(QUERY_LIMITS.adminDevicesMax, Math.max(1, parseInt(limit, 10) || QUERY_LIMITS.default));

  const filter = { status: STATUS.ACTIVE };
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ name: regex }, { device_id: regex }];
  }
  if (online_status === 'true' || online_status === 'false') {
    filter.online_status = online_status === 'true';
  }

  const [devices, total] = await Promise.all([
    Device.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Device.countDocuments(filter),
  ]);

  // Enrich with owner info
  const userIds = [...new Set(devices.map((d) => d.user_id))];
  const users = await User.find({ user_id: { $in: userIds } }).select('user_id first_name last_name email').lean();
  const userMap = {};
  users.forEach((u) => { userMap[u.user_id] = u; });

  const enriched = devices.map((d) => ({
    ...d,
    owner: userMap[d.user_id] || null,
  }));

  res.json({
    message: 'OK',
    data: enriched,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

const updateAdminDevice = asyncHandler(async (req, res) => {
  logger.debug('updateAdminDevice called');
  const { id } = req.params;
  const { name, version } = req.body;

  const device = await Device.findOneAndUpdate(
    { _id: id, status: STATUS.ACTIVE },
    { ...(name && { name }), ...(version && { version }) },
    { new: true }
  );
  if (!device) {
    res.status(404);
    throw new Error(`Device not found: ${id}`);
  }
  res.json({ message: 'OK', data: device });
});

const deleteAdminDevice = asyncHandler(async (req, res) => {
  logger.debug('deleteAdminDevice called');
  const { id } = req.params;

  const device = await Device.findOneAndUpdate(
    { _id: id, status: STATUS.ACTIVE },
    { status: STATUS.DELETED },
    { new: true }
  );
  if (!device) {
    res.status(404);
    throw new Error(`Device not found: ${id}`);
  }
  // Also soft-delete sensors under this device
  await Sensor.updateMany(
    { device_id: device.device_id, status: STATUS.ACTIVE },
    { status: STATUS.DELETED }
  );

  res.json({ message: 'OK', data: { deleted: device._id } });
});

// ─── Phase 3: Admin Sensor Management ───────────────────────────────────────
const getAdminSensors = asyncHandler(async (req, res) => {
  logger.debug('getAdminSensors called');
  const { search, device_id, sensor_type, page = 1, limit = QUERY_LIMITS.default } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(QUERY_LIMITS.adminSensorsMax, Math.max(1, parseInt(limit, 10) || QUERY_LIMITS.default));

  const filter = { status: STATUS.ACTIVE };
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ sensor_name: regex }, { sensor_id: regex }];
  }
  if (device_id) filter.device_id = device_id;
  if (sensor_type) filter.sensor_type = sensor_type;

  const [sensors, total] = await Promise.all([
    Sensor.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Sensor.countDocuments(filter),
  ]);

  // Enrich with device name
  const deviceIds = [...new Set(sensors.map((s) => s.device_id))];
  const devices = await Device.find({ device_id: { $in: deviceIds } }).select('device_id name').lean();
  const deviceMap = {};
  devices.forEach((d) => { deviceMap[d.device_id] = d.name; });

  const enriched = sensors.map((s) => ({
    ...s,
    device_name: deviceMap[s.device_id] || s.device_id,
  }));

  res.json({
    message: 'OK',
    data: enriched,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

const updateAdminSensor = asyncHandler(async (req, res) => {
  logger.debug('updateAdminSensor called');
  const { id } = req.params;
  const { sensor_name, unit, max, min, ratio, bgcolor } = req.body;

  const update = {};
  if (sensor_name !== undefined) update.sensor_name = sensor_name;
  if (unit !== undefined) update.unit = unit;
  if (max !== undefined) update.max = max;
  if (min !== undefined) update.min = min;
  if (ratio !== undefined) update.ratio = ratio;
  if (bgcolor !== undefined) update.bgcolor = bgcolor;

  const sensor = await Sensor.findOneAndUpdate(
    { _id: id, status: STATUS.ACTIVE },
    update,
    { new: true }
  );
  if (!sensor) {
    res.status(404);
    throw new Error(`Sensor not found: ${id}`);
  }
  res.json({ message: 'OK', data: sensor });
});

const deleteAdminSensor = asyncHandler(async (req, res) => {
  logger.debug('deleteAdminSensor called');
  const { id } = req.params;

  const sensor = await Sensor.findOneAndUpdate(
    { _id: id, status: STATUS.ACTIVE },
    { status: STATUS.DELETED },
    { new: true }
  );
  if (!sensor) {
    res.status(404);
    throw new Error(`Sensor not found: ${id}`);
  }
  res.json({ message: 'OK', data: { deleted: sensor._id } });
});

// ─── Phase 5: Admin Device Logs ─────────────────────────────────────────────
const getAdminDeviceLogs = asyncHandler(async (req, res) => {
  logger.debug('getAdminDeviceLogs called');
  const { device_id, event, page = 1, limit = QUERY_LIMITS.default } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(QUERY_LIMITS.adminDeviceLogsMax, Math.max(1, parseInt(limit, 10) || QUERY_LIMITS.default));

  const filter = {};
  if (device_id) filter.device_id = device_id;
  if (event) filter.event = event;

  const [logs, total] = await Promise.all([
    DeviceLog.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    DeviceLog.countDocuments(filter),
  ]);

  // Enrich with device name
  const deviceIds = [...new Set(logs.map((l) => l.device_id))];
  const devices = await Device.find({ device_id: { $in: deviceIds } }).select('device_id name').lean();
  const deviceMap = {};
  devices.forEach((d) => { deviceMap[d.device_id] = d.name; });

  const enriched = logs.map((l) => ({
    ...l,
    device_name: deviceMap[l.device_id] || l.device_id,
  }));

  res.json({
    message: 'OK',
    data: enriched,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

// ─── Phase 6: Admin Notification Management ──────────────────────────────────
const getAdminNotifications = asyncHandler(async (req, res) => {
  logger.debug('getAdminNotifications called');
  const { search, type, severity, is_read, page = 1, limit = QUERY_LIMITS.default } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(QUERY_LIMITS.adminNotificationsMax, Math.max(1, parseInt(limit, 10) || QUERY_LIMITS.default));

  const filter = { status: STATUS.ACTIVE };
  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [{ title: regex }, { message: regex }];
  }
  if (type) filter.type = type;
  if (severity) filter.severity = severity;
  if (is_read === 'true' || is_read === 'false') {
    filter.is_read = is_read === 'true';
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Notification.countDocuments(filter),
  ]);

  // Enrich with user name
  const userIds = [...new Set(notifications.map((n) => n.user_id))];
  const users = await User.find({ user_id: { $in: userIds } }).select('user_id first_name last_name').lean();
  const userMap = {};
  users.forEach((u) => { userMap[u.user_id] = `${u.first_name} ${u.last_name}`; });

  const enriched = notifications.map((n) => ({
    ...n,
    user_name: userMap[n.user_id] || n.user_id,
  }));

  res.json({
    message: 'OK',
    data: enriched,
    pagination: paginationMeta(pageNum, limitNum, total),
  });
});

const createSystemNotification = asyncHandler(async (req, res) => {
  logger.debug('createSystemNotification called');
  const { title, message, severity = 'info' } = req.body;

  // Send to all active users
  const activeUsers = await User.find({ status: STATUS.ACTIVE }).select('user_id').lean();
  const docs = activeUsers.map((u) => ({
    user_id: u.user_id,
    type: 'system',
    title,
    message,
    severity,
    status: STATUS.ACTIVE,
  }));

  const result = await Notification.insertMany(docs);

  res.status(201).json({
    message: 'OK',
    data: { sent: result.length },
  });
});

// ─── Phase 8: System Info ───────────────────────────────────────────────────
const getSystemInfo = asyncHandler(async (req, res) => {
  logger.debug('getSystemInfo called');
  const config = require('../config');

  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    message: 'OK',
    data: {
      server: {
        nodeEnv: config.nodeEnv,
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      },
      database: {
        status: dbStatus,
        name: mongoose.connection.name || 'unknown',
      },
      mqtt: {
        configured: !!config.mqttUrl,
      },
      email: {
        configured: !!config.resendApiKey,
      },
      defaults: {
        jwtExpiry: config.jwtExpiry,
        refreshExpiry: config.refreshExpiry,
        sensorDataTTL: config.sensorDataTTL,
        rateLimitMax: config.rateLimitMax,
        authRateLimitMax: config.authRateLimitMax,
        rateLimitWindowMs: config.rateLimitWindowMs,
      },
    },
  });
});

// ─── Phase 10: Bulk Operations ──────────────────────────────────────────────
const bulkUpdateRole = asyncHandler(async (req, res) => {
  logger.debug('bulkUpdateRole called');
  const { user_ids, role } = req.body;

  const result = await User.updateMany(
    { _id: { $in: user_ids }, status: STATUS.ACTIVE },
    { role }
  );

  // If setting to admin, give wildcard permissions
  if (role === 'admin') {
    const users = await User.find({ _id: { $in: user_ids } }).select('user_id').lean();
    const ops = users.map((u) =>
      Permission.findOneAndUpdate(
        { user_id: getUserId(u) },
        { permissions: ['*'] },
        { upsert: true }
      )
    );
    await Promise.all(ops);
  }

  res.json({ message: 'OK', data: { modified: result.modifiedCount } });
});

const bulkDeleteUsers = asyncHandler(async (req, res) => {
  logger.debug('bulkDeleteUsers called');
  const { user_ids } = req.body;

  const result = await User.updateMany(
    { _id: { $in: user_ids }, status: STATUS.ACTIVE },
    { status: STATUS.DELETED }
  );

  res.json({ message: 'OK', data: { deleted: result.modifiedCount } });
});

const bulkDeleteDevices = asyncHandler(async (req, res) => {
  logger.debug('bulkDeleteDevices called');
  const { device_ids } = req.body;

  const devices = await Device.find({ _id: { $in: device_ids }, status: STATUS.ACTIVE }).lean();
  const deviceIdStrings = devices.map((d) => d.device_id);

  const result = await Device.updateMany(
    { _id: { $in: device_ids }, status: STATUS.ACTIVE },
    { status: STATUS.DELETED }
  );

  // Also soft-delete sensors under these devices
  if (deviceIdStrings.length > 0) {
    await Sensor.updateMany(
      { device_id: { $in: deviceIdStrings }, status: STATUS.ACTIVE },
      { status: STATUS.DELETED }
    );
  }

  res.json({ message: 'OK', data: { deleted: result.modifiedCount } });
});

module.exports = {
  getAdminUsers,
  getAdminUser,
  updateUserRole,
  getUserPermissions,
  updateUserPermissions,
  getPermissionDefinitions,
  getAdminMenus,
  getUserMenus,
  updateUserMenus,
  // Phase 1
  getAdminStats,
  // Phase 2
  getAdminDevices,
  updateAdminDevice,
  deleteAdminDevice,
  // Phase 3
  getAdminSensors,
  updateAdminSensor,
  deleteAdminSensor,
  // Phase 5
  getAdminDeviceLogs,
  // Phase 6
  getAdminNotifications,
  createSystemNotification,
  // Phase 8
  getSystemInfo,
  // Phase 10
  bulkUpdateRole,
  bulkDeleteUsers,
  bulkDeleteDevices,
};
