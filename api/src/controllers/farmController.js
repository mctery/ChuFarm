const Farm = require('../models/farmModel');
const Zone = require('../models/zoneModel');
const Device = require('../models/deviceModel');
const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { paginateQuery } = require('../utils/pagination');
const { findAndAuthorize } = require('../utils/errors');

const FARM_OPTS = { name: 'Farm' };

const getFarms = asyncHandler(async (req, res) => {
  logger.debug('getFarms called');
  const filter = { user_id: req.User_name.userId, status: STATUS.ACTIVE };
  if (req.User_name.role === 'admin' && req.query.all === 'true') {
    delete filter.user_id;
  }
  const result = await paginateQuery(Farm, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getFarm = asyncHandler(async (req, res) => {
  logger.debug('getFarm called');
  const farm = await findAndAuthorize(res, req, Farm, req.params.id, FARM_OPTS);
  const zones = await Zone.find({ farm_id: farm._id, status: STATUS.ACTIVE });
  res.json({ message: 'OK', data: { ...farm.toObject(), zones } });
});

const createFarm = asyncHandler(async (req, res) => {
  logger.debug('createFarm called');
  req.body.user_id = req.User_name.userId;
  req.body.status = STATUS.ACTIVE;
  const farm = await Farm.create(req.body);
  res.status(201).json({ message: 'OK', data: farm });
});

const updateFarm = asyncHandler(async (req, res) => {
  logger.debug('updateFarm called');
  await findAndAuthorize(res, req, Farm, req.params.id, FARM_OPTS);
  const updated = await Farm.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ message: 'OK', data: updated });
});

const deleteFarm = asyncHandler(async (req, res) => {
  logger.debug('deleteFarm called');
  const farm = await findAndAuthorize(res, req, Farm, req.params.id, FARM_OPTS);
  await Farm.findByIdAndUpdate(req.params.id, { status: STATUS.DELETED });
  await Zone.updateMany({ farm_id: farm._id, status: STATUS.ACTIVE }, { status: STATUS.DELETED });
  res.json({ message: 'OK', data: 'Farm deleted' });
});

const getFarmStats = asyncHandler(async (req, res) => {
  logger.debug('getFarmStats called');
  const farm = await findAndAuthorize(res, req, Farm, req.params.id, FARM_OPTS);

  const zones = await Zone.find({ farm_id: farm._id, status: STATUS.ACTIVE }).lean();
  const zoneIds = zones.map((z) => z._id);

  const [devices, recentAlerts] = await Promise.all([
    Device.find({ zone_id: { $in: zoneIds }, status: STATUS.ACTIVE }).select('device_id online_status').lean(),
    Notification.countDocuments({
      user_id: farm.user_id,
      is_read: false,
      status: STATUS.ACTIVE,
    }),
  ]);
  const onlineCount = devices.filter((d) => d.online_status).length;

  res.json({
    message: 'OK',
    data: {
      farm_id: farm._id,
      zone_count: zones.length,
      device_count: devices.length,
      online_count: onlineCount,
      unread_alerts: recentAlerts,
    },
  });
});

module.exports = { getFarms, getFarm, createFarm, updateFarm, deleteFarm, getFarmStats };
