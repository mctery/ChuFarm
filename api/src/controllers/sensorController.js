const Sensor = require('../models/sensorModel');
const Device = require('../models/deviceModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { normalizeStatus } = require('../utils/pagination');

const getSensors = asyncHandler(async (req, res) => {
  logger.debug('getSensors called');
  const { role, userId } = req.User_name;

  // Admin sees all sensors; regular users only see sensors belonging to their devices
  if (role === 'admin') {
    const sensors = await Sensor.find({ status: STATUS.ACTIVE });
    return res.json({ message: 'OK', data: sensors });
  }

  const userDevices = await Device.find({ user_id: userId, status: STATUS.ACTIVE }).select('device_id');
  const deviceIds = userDevices.map((d) => d.device_id);
  const sensors = await Sensor.find({ device_id: { $in: deviceIds }, status: STATUS.ACTIVE });
  res.json({ message: 'OK', data: sensors });
});

const getSensor = asyncHandler(async (req, res) => {
  logger.debug('getSensor called');
  const sensor = await Sensor.findById(req.params.id);
  if (!sensor) {
    res.status(404);
    throw new Error(`Sensor not found: ${req.params.id}`);
  }
  res.json({ message: 'OK', data: sensor });
});

const getDeviceSensor = asyncHandler(async (req, res) => {
  logger.debug('getDeviceSensor called');
  const { id, type } = req.params;
  const sensor = await Sensor.find({ device_id: id, sensor_type: type, status: STATUS.ACTIVE });
  res.json({ message: 'OK', data: sensor });
});

const getDeviceSensorById = asyncHandler(async (req, res) => {
  logger.debug('getDeviceSensorById called');
  const sensor = await Sensor.find({ device_id: req.params.id, status: STATUS.ACTIVE });
  res.json({ message: 'OK', data: sensor });
});

const createSensor = asyncHandler(async (req, res) => {
  logger.debug('createSensor called');
  req.body.status = normalizeStatus(req.body.status);
  const sensor = await Sensor.create(req.body);
  res.status(201).json({ message: 'OK', data: sensor });
});

const updateSensor = asyncHandler(async (req, res) => {
  logger.debug('updateSensor called');
  const { id } = req.params;
  const updateData = { ...req.body };
  if (updateData.status !== undefined) {
    updateData.status = normalizeStatus(updateData.status);
  }
  const updatedSensor = await Sensor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!updatedSensor) {
    res.status(404);
    throw new Error(`Sensor not found: ${id}`);
  }
  res.json({ message: 'OK', data: updatedSensor });
});

const deleteSensor = asyncHandler(async (req, res) => {
  logger.debug('deleteSensor called');
  const sensor = await Sensor.findByIdAndUpdate(
    req.params.id,
    { status: STATUS.DELETED },
    { new: true }
  );
  if (!sensor) {
    res.status(404);
    throw new Error(`Sensor not found: ${req.params.id}`);
  }
  res.json({ message: 'OK', data: sensor });
});

module.exports = {
  getSensors,
  getSensor,
  getDeviceSensor,
  getDeviceSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
};
