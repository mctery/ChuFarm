const DeviceProfile = require('../models/deviceProfileModel');
const Device = require('../models/deviceModel');
const DeviceLog = require('../models/deviceLogModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { paginateQuery } = require('../utils/pagination');

const getProfiles = asyncHandler(async (req, res) => {
  logger.debug('getProfiles called');
  const filter = { status: STATUS.ACTIVE };
  const result = await paginateQuery(DeviceProfile, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getProfile = asyncHandler(async (req, res) => {
  logger.debug('getProfile called');
  const profile = await DeviceProfile.findOne({ _id: req.params.id, status: STATUS.ACTIVE });
  if (!profile) {
    res.status(404);
    throw new Error('Device profile not found');
  }
  res.json({ message: 'OK', data: profile });
});

const createProfile = asyncHandler(async (req, res) => {
  logger.debug('createProfile called');
  req.body.status = STATUS.ACTIVE;
  const profile = await DeviceProfile.create(req.body);
  res.status(201).json({ message: 'OK', data: profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  logger.debug('updateProfile called');
  const profile = await DeviceProfile.findOneAndUpdate(
    { _id: req.params.id, status: STATUS.ACTIVE },
    req.body,
    { new: true, runValidators: true }
  );
  if (!profile) {
    res.status(404);
    throw new Error('Device profile not found');
  }
  res.json({ message: 'OK', data: profile });
});

const deleteProfile = asyncHandler(async (req, res) => {
  logger.debug('deleteProfile called');
  const profile = await DeviceProfile.findOneAndUpdate(
    { _id: req.params.id, status: STATUS.ACTIVE },
    { status: STATUS.DELETED },
    { new: true }
  );
  if (!profile) {
    res.status(404);
    throw new Error('Device profile not found');
  }
  res.json({ message: 'OK', data: 'Profile deleted' });
});

const getDeviceHealth = asyncHandler(async (req, res) => {
  logger.debug('getDeviceHealth called');
  const device = await Device.findOne({ _id: req.params.id, status: STATUS.ACTIVE })
    .select('device_id name firmware_version hardware_version battery_level signal_strength ip_address mac_address uptime_seconds online_status last_seen');

  if (!device) {
    res.status(404);
    throw new Error('Device not found');
  }

  // Get recent online/offline history
  const recentLogs = await DeviceLog.find({ device_id: device.device_id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    message: 'OK',
    data: {
      ...device.toObject(),
      recent_logs: recentLogs,
    },
  });
});

module.exports = { getProfiles, getProfile, createProfile, updateProfile, deleteProfile, getDeviceHealth };
