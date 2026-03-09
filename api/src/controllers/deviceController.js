const Device = require('../models/deviceModel');
const SensorWidget = require('../models/sensorWidgetModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { paginateQuery, normalizeStatus, findDeviceFlexible } = require('../utils/pagination');

let commandClient = null;
function setCommandClient(client) {
  commandClient = client;
}

const getDevices = asyncHandler(async (req, res) => {
  logger.debug('getDevices called');
  const filter = { status: STATUS.ACTIVE };
  const result = await paginateQuery(Device, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getDevice = asyncHandler(async (req, res) => {
  logger.debug('getDevice called');
  const device = await findDeviceFlexible(Device, req.params.id);
  if (!device) {
    res.status(404);
    throw new Error(`Device not found: ${req.params.id}`);
  }
  res.json({ message: 'OK', data: device });
});

const getDeviceUser = asyncHandler(async (req, res) => {
  logger.debug('getDeviceUser called');
  const filter = { user_id: req.params.user_id, status: STATUS.ACTIVE };
  const result = await paginateQuery(Device, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const createDevice = asyncHandler(async (req, res) => {
  logger.debug('createDevice called');
  req.body.status = STATUS.ACTIVE;
  req.body.user_id = req.User_name.userId;

  const exists = await Device.findOne({ device_id: req.body.device_id });
  if (exists) {
    res.status(400);
    throw new Error('device_id already exists');
  }

  const device = await Device.create(req.body);
  await SensorWidget.create({ device_id: req.body.device_id });
  res.status(201).json({ message: 'OK', data: device });
});

const updateDevice = asyncHandler(async (req, res) => {
  logger.debug('updateDevice called');
  const { id } = req.params;
  const updateData = { ...req.body };
  updateData.status = normalizeStatus(updateData.status);

  const updatedDevice = await Device.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updatedDevice) {
    res.status(404);
    throw new Error(`Device not found: ${id}`);
  }
  res.json({ message: 'OK', data: updatedDevice });
});

const deleteDevice = asyncHandler(async (req, res) => {
  logger.debug('deleteDevice called');
  const device = await Device.findByIdAndUpdate(req.params.id, { status: STATUS.DELETED }, { new: true });
  if (!device) {
    res.status(404);
    throw new Error(`Device not found: ${req.params.id}`);
  }
  res.json({ message: 'OK', data: device });
});

const sendDeviceCommand = asyncHandler(async (req, res) => {
  logger.debug('sendDeviceCommand called');
  const { id } = req.params;
  const { command, payload } = req.body;

  if (!commandClient) {
    res.status(503);
    throw new Error('MQTT not configured');
  }

  const topic = `request/${id}/${command}`;
  commandClient.publish(topic, JSON.stringify(payload || {}));
  res.json({ message: 'OK' });
});

module.exports = {
  getDevices,
  getDevice,
  getDeviceUser,
  createDevice,
  updateDevice,
  deleteDevice,
  sendDeviceCommand,
  setCommandClient,
};
