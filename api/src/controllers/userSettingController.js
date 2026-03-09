const UserSetting = require('../models/userSettingModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { sendLineNotify } = require('../services/lineNotifyService');

const getUserSetting = asyncHandler(async (req, res) => {
  logger.debug('getUserSetting called');
  const { user_id } = req.params;

  let setting = await UserSetting.findOne({ user_id });

  // Auto-create default settings if not exists
  if (!setting) {
    setting = await UserSetting.create({ user_id });
  }

  res.json({ message: 'OK', data: setting });
});

const updateUserSetting = asyncHandler(async (req, res) => {
  logger.debug('updateUserSetting called');
  const { user_id } = req.params;

  const setting = await UserSetting.findOneAndUpdate(
    { user_id },
    req.body,
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ message: 'OK', data: setting });
});

const connectLine = asyncHandler(async (req, res) => {
  logger.debug('connectLine called');
  const { user_id } = req.params;
  const { token } = req.body;

  if (!token || typeof token !== 'string' || token.length < 10) {
    res.status(400);
    throw new Error('Invalid LINE Notify token');
  }

  // Verify token by sending a test message
  const success = await sendLineNotify(token, '\nSmartFarm: LINE Notify เชื่อมต่อสำเร็จ!');
  if (!success) {
    res.status(400);
    throw new Error('LINE Notify token is invalid or expired');
  }

  await UserSetting.findOneAndUpdate(
    { user_id },
    { line_token: token, 'notification.line': true },
    { upsert: true }
  );

  res.json({ message: 'OK', data: 'LINE Notify connected' });
});

const disconnectLine = asyncHandler(async (req, res) => {
  logger.debug('disconnectLine called');
  const { user_id } = req.params;

  await UserSetting.findOneAndUpdate(
    { user_id },
    { line_token: null, 'notification.line': false }
  );

  res.json({ message: 'OK', data: 'LINE Notify disconnected' });
});

const testLine = asyncHandler(async (req, res) => {
  logger.debug('testLine called');
  const { user_id } = req.params;

  const setting = await UserSetting.findOne({ user_id });
  if (!setting || !setting.line_token) {
    res.status(400);
    throw new Error('LINE Notify not connected');
  }

  const success = await sendLineNotify(
    setting.line_token,
    '\nSmartFarm: ทดสอบการแจ้งเตือน LINE สำเร็จ!'
  );

  if (!success) {
    res.status(500);
    throw new Error('Failed to send LINE notification');
  }

  res.json({ message: 'OK', data: 'Test notification sent' });
});

module.exports = {
  getUserSetting,
  updateUserSetting,
  connectLine,
  disconnectLine,
  testLine,
};
