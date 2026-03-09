const SensorWidget = require('../models/sensorWidgetModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');

const getSensorWidget = asyncHandler(async (req, res) => {
  logger.debug('getSensorWidget called');
  const result = await SensorWidget.find({ device_id: req.params.device_id });
  res.json({ message: 'OK', data: result });
});

const createSensorWidget = asyncHandler(async (req, res) => {
  logger.debug('createSensorWidget called');
  const result = await SensorWidget.create(req.body);
  res.status(201).json({ message: 'OK', data: result });
});

const updateSensorWidget = asyncHandler(async (req, res) => {
  logger.debug('updateSensorWidget called');
  const { device_id } = req.params;
  const updatedWidget = await SensorWidget.findOneAndUpdate(
    { device_id },
    { widget_json: JSON.stringify(req.body) },
    { new: true }
  );
  if (!updatedWidget) {
    res.status(404);
    throw new Error(`SensorWidget not found: ${device_id}`);
  }
  logger.debug('Updated widget', { device_id });
  res.json({ message: 'OK', data: updatedWidget });
});

const deleteSensorWidget = asyncHandler(async (req, res) => {
  logger.debug('deleteSensorWidget called');
  const { device_id } = req.params;
  const result = await SensorWidget.findOneAndUpdate({ device_id }, { status: STATUS.DELETED });
  if (!result) {
    res.status(404);
    throw new Error(`SensorWidget not found: ${device_id}`);
  }
  res.json({ message: 'OK', data: result });
});

module.exports = {
  getSensorWidget,
  createSensorWidget,
  updateSensorWidget,
  deleteSensorWidget,
};
