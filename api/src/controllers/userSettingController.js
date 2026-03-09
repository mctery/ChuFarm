const UserSetting = require('../models/userSettingModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');

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

module.exports = {
  getUserSetting,
  updateUserSetting,
};
