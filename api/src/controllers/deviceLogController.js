const DeviceLog = require('../models/deviceLogModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { QUERY_LIMITS } = require('../config');
const { paginateQuery } = require('../utils/pagination');

const getDeviceLogs = asyncHandler(async (req, res) => {
  logger.debug('getDeviceLogs called');
  const { device_id } = req.params;
  const filter = { device_id };
  if (req.query?.event) {
    filter.event = req.query.event;
  }

  const result = await paginateQuery(DeviceLog, filter, req.query, {
    defaultLimit: QUERY_LIMITS.deviceLogs,
  });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getDeviceOnlineHistory = asyncHandler(async (req, res) => {
  logger.debug('getDeviceOnlineHistory called');
  const { device_id } = req.params;
  const logs = await DeviceLog.find({
    device_id,
    event: { $in: ['online', 'offline'] },
  })
    .sort({ createdAt: -1 })
    .limit(QUERY_LIMITS.onlineHistory);
  res.json({ message: 'OK', data: logs });
});

module.exports = {
  getDeviceLogs,
  getDeviceOnlineHistory,
};
