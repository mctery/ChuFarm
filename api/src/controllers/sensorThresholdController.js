const SensorThreshold = require('../models/sensorThresholdModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');

const getThresholdsByDevice = asyncHandler(async (req, res) => {
  logger.debug('getThresholdsByDevice called');
  const thresholds = await SensorThreshold.find({
    device_id: req.params.device_id,
    is_active: true,
  });
  res.json({ message: 'OK', data: thresholds });
});

const getThresholdsByUser = asyncHandler(async (req, res) => {
  logger.debug('getThresholdsByUser called');
  const thresholds = await SensorThreshold.find({
    user_id: req.params.user_id,
    is_active: true,
  });
  res.json({ message: 'OK', data: thresholds });
});

const createThreshold = asyncHandler(async (req, res) => {
  logger.debug('createThreshold called');
  const threshold = await SensorThreshold.create(req.body);
  res.status(201).json({ message: 'OK', data: threshold });
});

const updateThreshold = asyncHandler(async (req, res) => {
  logger.debug('updateThreshold called');
  const threshold = await SensorThreshold.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  if (!threshold) {
    res.status(404);
    throw new Error('Threshold not found');
  }
  res.json({ message: 'OK', data: threshold });
});

const deleteThreshold = asyncHandler(async (req, res) => {
  logger.debug('deleteThreshold called');
  const threshold = await SensorThreshold.findByIdAndUpdate(
    req.params.id,
    { is_active: false },
    { new: true }
  );
  if (!threshold) {
    res.status(404);
    throw new Error('Threshold not found');
  }
  res.json({ message: 'OK', data: threshold });
});

module.exports = {
  getThresholdsByDevice,
  getThresholdsByUser,
  createThreshold,
  updateThreshold,
  deleteThreshold,
};
