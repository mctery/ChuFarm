const Zone = require('../models/zoneModel');
const Farm = require('../models/farmModel');
const Device = require('../models/deviceModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { paginateQuery } = require('../utils/pagination');
const { notFound, checkOwner, findAndAuthorize } = require('../utils/errors');

const FARM_OPTS = { name: 'Farm' };

const getZonesByFarm = asyncHandler(async (req, res) => {
  logger.debug('getZonesByFarm called');
  await findAndAuthorize(res, req, Farm, req.params.farm_id, FARM_OPTS);
  const filter = { farm_id: req.params.farm_id, status: STATUS.ACTIVE };
  const result = await paginateQuery(Zone, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getZone = asyncHandler(async (req, res) => {
  logger.debug('getZone called');
  const zone = await Zone.findOne({ _id: req.params.id, status: STATUS.ACTIVE })
    .populate('farm_id', 'user_id');
  notFound(res, zone, 'Zone');

  if (req.User_name.role !== 'admin' && zone.farm_id?.user_id !== req.User_name.userId) {
    res.status(403);
    throw new Error('Access denied');
  }

  const devices = await Device.find({ zone_id: zone._id, status: STATUS.ACTIVE });
  const zoneObj = zone.toObject();
  zoneObj.farm_id = zone.farm_id?._id || zone.farm_id;
  res.json({ message: 'OK', data: { ...zoneObj, devices } });
});

const createZone = asyncHandler(async (req, res) => {
  logger.debug('createZone called');
  await findAndAuthorize(res, req, Farm, req.params.farm_id, FARM_OPTS);
  req.body.farm_id = req.params.farm_id;
  req.body.status = STATUS.ACTIVE;
  const zone = await Zone.create(req.body);
  res.status(201).json({ message: 'OK', data: zone });
});

const updateZone = asyncHandler(async (req, res) => {
  logger.debug('updateZone called');
  const zone = await Zone.findOne({ _id: req.params.id, status: STATUS.ACTIVE });
  notFound(res, zone, 'Zone');
  const farm = await Farm.findById(zone.farm_id);
  if (farm) checkOwner(res, req, farm.user_id);

  const updated = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ message: 'OK', data: updated });
});

const deleteZone = asyncHandler(async (req, res) => {
  logger.debug('deleteZone called');
  const zone = await Zone.findOne({ _id: req.params.id, status: STATUS.ACTIVE });
  notFound(res, zone, 'Zone');
  const farm = await Farm.findById(zone.farm_id);
  if (farm) checkOwner(res, req, farm.user_id);

  await Zone.findByIdAndUpdate(req.params.id, { status: STATUS.DELETED });
  res.json({ message: 'OK', data: 'Zone deleted' });
});

module.exports = { getZonesByFarm, getZone, createZone, updateZone, deleteZone };
