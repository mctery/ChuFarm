const crypto = require('crypto');
const User = require('../models/userModel');
const Permission = require('../models/permissionModel');
const Menu = require('../models/menuModel');
const UserMenu = require('../models/userMenuModel');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiry, refreshSecret, refreshExpiry, bcryptRounds, STATUS, appUrl, resetTokenExpiryMs } = require('../config');
const { sendPasswordResetEmail } = require('../services/emailService');
const { DEFAULT_USER_PERMISSIONS } = require('../config/permissions');
const { buildMenuHierarchy } = require('./menuController');
const getUserId = require('../utils/getUserId');
const logger = require('../config/logger');

/** Resolve permissions array for a user based on role. */
async function resolvePermissions(role, userId) {
  if (role === 'admin') return ['*'];
  const permDoc = await Permission.findOne({ user_id: userId });
  return permDoc ? permDoc.permissions : DEFAULT_USER_PERMISSIONS;
}

/** Resolve accessible menus for a user, returned as hierarchy. */
async function resolveMenus(role, userId) {
  let menus;
  if (role === 'admin') {
    menus = await Menu.find({ status: STATUS.ACTIVE });
  } else {
    const userMenu = await UserMenu.findOne({ user_id: userId });
    if (!userMenu || userMenu.menu_ids.length === 0) return [];
    menus = await Menu.find({ _id: { $in: userMenu.menu_ids }, status: STATUS.ACTIVE });
  }
  return buildMenuHierarchy(menus);
}

const getUsers = asyncHandler(async (req, res) => {
  logger.debug('getUsers called');
  const users = await User.find({ status: STATUS.ACTIVE }).select('-password');
  res.json({ message: 'OK', data: users });
});

const getUser = asyncHandler(async (req, res) => {
  logger.debug('getUser called');
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${req.params.id}`);
  }
  res.json({ message: 'OK', data: user });
});

const getMe = asyncHandler(async (req, res) => {
  logger.debug('getMe called');
  const email = req.User_name && req.User_name.user;
  const user = await User.findOne({ email, status: STATUS.ACTIVE }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ message: 'OK', data: user });
});

const updateMe = asyncHandler(async (req, res) => {
  logger.debug('updateMe called');
  const email = req.User_name && req.User_name.user;
  const user = await User.findOne({ email, status: STATUS.ACTIVE });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const info = req.body;
  if (info.password) {
    info.password = await bcrypt.hash(info.password, bcryptRounds);
  }
  // Prevent changing email/status/role via profile update
  delete info.email;
  delete info.status;
  delete info.role;

  const updatedUser = await User.findByIdAndUpdate(user._id, info, { new: true }).select('-password');
  res.json({ message: 'OK', data: updatedUser });
});

const login = asyncHandler(async (req, res) => {
  logger.debug('login called');
  const { email, password } = req.body;
  logger.info('Login attempt', { email });

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const userId = getUserId(user);
  const role = user.role || 'user';
  const [permissions, menus] = await Promise.all([
    resolvePermissions(role, userId),
    resolveMenus(role, userId),
  ]);

  const token = jwt.sign({ user: user.email, userId, role, permissions }, jwtSecret, { expiresIn: jwtExpiry });
  const refresh_token = jwt.sign({ user: user.email, type: 'refresh' }, refreshSecret, { expiresIn: refreshExpiry });
  res.json({
    message: 'OK',
    token,
    refresh_token,
    data: {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_id: userId,
      role,
      permissions,
      menus,
    },
  });
});

const refreshToken = asyncHandler(async (req, res) => {
  logger.debug('refreshToken called');
  const { refresh_token } = req.body;
  if (!refresh_token) {
    res.status(401);
    throw new Error('Refresh token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(refresh_token, refreshSecret);
  } catch (error) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }

  if (decoded.type !== 'refresh') {
    res.status(401);
    throw new Error('Invalid token type');
  }

  const user = await User.findOne({ email: decoded.user, status: STATUS.ACTIVE });
  if (!user) {
    res.status(401);
    throw new Error('User not found or inactive');
  }

  const userId = getUserId(user);
  const role = user.role || 'user';
  const permissions = await resolvePermissions(role, userId);

  const token = jwt.sign({ user: decoded.user, userId, role, permissions }, jwtSecret, { expiresIn: jwtExpiry });
  const new_refresh_token = jwt.sign({ user: decoded.user, type: 'refresh' }, refreshSecret, { expiresIn: refreshExpiry });
  res.json({ message: 'OK', token, refresh_token: new_refresh_token });
});

const createUser = asyncHandler(async (req, res) => {
  logger.debug('createUser called');
  const info = req.body;
  logger.info('Registering user', { email: info.email });

  const existing = await User.findOne({ email: info.email });
  if (existing) {
    res.status(409);
    throw new Error('User already exists');
  }

  info.password = await bcrypt.hash(info.password, bcryptRounds);
  info.status = STATUS.ACTIVE;
  const user = await User.create(info);

  // Create default Permission and UserMenu documents for the new user
  const userId = getUserId(user);
  await Permission.create({ user_id: userId, permissions: DEFAULT_USER_PERMISSIONS });

  // Assign all non-admin menus to the new user
  const defaultMenus = await Menu.find({ status: STATUS.ACTIVE, parent_id: null, key: { $nin: ['admin'] } });
  const childMenus = await Menu.find({ status: STATUS.ACTIVE, parent_id: { $in: defaultMenus.map(m => m._id) } });
  const allDefaultMenuIds = [...defaultMenus.map(m => m._id), ...childMenus.map(m => m._id)];
  await UserMenu.create({ user_id: userId, menu_ids: allDefaultMenuIds });

  // Return without password
  const safeUser = user.toObject();
  delete safeUser.password;
  res.status(201).json({ message: 'OK', data: safeUser });
});

const updateUser = asyncHandler(async (req, res) => {
  logger.debug('updateUser called');
  const { id } = req.params;
  const info = req.body;

  if (info.password) {
    info.password = await bcrypt.hash(info.password, bcryptRounds);
  }

  const updatedUser = await User.findByIdAndUpdate(id, info, { new: true }).select('-password');
  if (!updatedUser) {
    res.status(404);
    throw new Error(`User not found: ${id}`);
  }
  res.json({ message: 'OK', data: updatedUser });
});

const deleteUser = asyncHandler(async (req, res) => {
  logger.debug('deleteUser called');
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(id, { status: STATUS.DELETED }).select('-password');
  if (!user) {
    res.status(404);
    throw new Error(`User not found: ${id}`);
  }
  res.json({ message: 'OK', data: user });
});

const forgotPassword = asyncHandler(async (req, res) => {
  logger.debug('forgotPassword called');
  const { email } = req.body;
  logger.info('Password reset requested', { email });

  // Always return success to prevent email enumeration
  const successResponse = { message: 'OK', data: 'หากอีเมลนี้มีอยู่ในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ' };

  const user = await User.findOne({ email, status: STATUS.ACTIVE });
  if (!user) {
    return res.json(successResponse);
  }

  // Generate a random token and hash it for storage
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetToken = hashedToken;
  user.resetTokenExpiry = new Date(Date.now() + resetTokenExpiryMs);
  await user.save();

  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail(email, resetUrl, user.first_name);
  } catch (err) {
    logger.error('Password reset email failed', { email, error: err.message });
  }

  res.json(successResponse);
});

const resetPassword = asyncHandler(async (req, res) => {
  logger.debug('resetPassword called');
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: new Date() },
    status: STATUS.ACTIVE,
  });

  if (!user) {
    res.status(400);
    throw new Error('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
  }

  user.password = await bcrypt.hash(password, bcryptRounds);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  logger.info('Password reset successful', { email: user.email });
  res.json({ message: 'OK', data: 'รีเซ็ตรหัสผ่านสำเร็จ' });
});

module.exports = {
  login,
  refreshToken,
  createUser,
  updateUser,
  deleteUser,
  getUsers,
  getUser,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
};
