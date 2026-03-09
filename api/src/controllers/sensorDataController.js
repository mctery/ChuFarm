const SensorData = require('../models/sensorDataModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');

const getSensorData = asyncHandler(async (req, res) => {
  logger.debug('getSensorData called');
  const { device_id, sensor, page, limit } = req.body;
  const query = { device_id, sensor };

  if (page > 0 && limit > 0) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      SensorData.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SensorData.countDocuments(query),
    ]);
    return res.json({
      message: 'OK',
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }

  const sensors = await SensorData.find(query);
  res.json({ message: 'OK', data: sensors });
});

const getSensorDataRange = asyncHandler(async (req, res) => {
  logger.debug('getSensorDataRange called');
  const { device_id, sensor, startDate, endDate } = req.body;
  const query = { device_id, sensor };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const pageNum = parseInt(req.body.page) || 0;
  const limitNum = parseInt(req.body.limit) || 0;

  if (pageNum > 0 && limitNum > 0) {
    const skip = (pageNum - 1) * limitNum;
    const [data, total] = await Promise.all([
      SensorData.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      SensorData.countDocuments(query),
    ]);
    return res.json({
      message: 'OK',
      data,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  }

  const sensors = await SensorData.find(query);
  res.json({ message: 'OK', data: sensors });
});

const createSensorDataValue = asyncHandler(async (req, res) => {
  logger.debug('createSensorDataValue called');
  const { device_id, dataset } = req.body;

  if (!device_id || !dataset || dataset.length === 0) {
    res.status(400);
    throw new Error('device_id and dataset are required');
  }

  const collection = dataset.map((item) => ({
    device_id,
    sensor_id: item.id,
    sensor: item.sensor,
    value: item.value,
  }));

  const result = await SensorData.create(collection);
  res.status(201).json({ message: 'OK', data: result });
});

const getAggregateSensorData = asyncHandler(async (req, res) => {
  logger.debug('getAggregateSensorData called');
  const { device_id, sensor, sensor_id, startDate, endDate, groupBy } = req.body;

  if (!device_id || !sensor) {
    res.status(400);
    throw new Error('device_id and sensor are required');
  }

  const match = { device_id, sensor };
  if (sensor_id) match.sensor_id = sensor_id;

  // Default to last 7 days if no date range is provided
  const effectiveEnd = endDate ? new Date(endDate) : new Date();
  const effectiveStart = startDate
    ? new Date(startDate)
    : new Date(effectiveEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

  match.createdAt = { $gte: effectiveStart, $lte: effectiveEnd };

  let dateGroup;
  if (groupBy === 'day') {
    dateGroup = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
    };
  } else {
    dateGroup = {
      year: { $year: '$createdAt' },
      month: { $month: '$createdAt' },
      day: { $dayOfMonth: '$createdAt' },
      hour: { $hour: '$createdAt' },
    };
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: dateGroup,
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
        time: { $first: '$createdAt' },
      },
    },
    { $sort: { time: 1 } },
    {
      $project: {
        _id: 0,
        time: 1,
        avg: { $round: ['$avg', 2] },
        min: { $round: ['$min', 2] },
        max: { $round: ['$max', 2] },
        count: 1,
      },
    },
  ];

  const result = await SensorData.aggregate(pipeline);
  res.json({ message: 'OK', data: result });
});



/**
 * Get the latest sensor value for each sensor_id+sensor of a device.
 * Returns data shaped like MQTT payloads: { "temperature": { v: { sensorId: value } }, ... }
 */
const getLatestByDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId) {
    res.status(400);
    throw new Error('deviceId is required');
  }

  const pipeline = [
    { $match: { device_id: deviceId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { sensor: '$sensor', sensor_id: '$sensor_id' },
        value: { $first: '$value' },
        createdAt: { $first: '$createdAt' },
      },
    },
  ];

  const results = await SensorData.aggregate(pipeline);

  const grouped = {};
  for (const row of results) {
    const sensorType = row._id.sensor;
    if (!grouped[sensorType]) {
      grouped[sensorType] = { device_id: deviceId, v: {} };
    }
    grouped[sensorType].v[row._id.sensor_id] = row.value;
  }

  res.json({ message: 'OK', data: grouped });
});

module.exports = {
  getSensorData,
  createSensorDataValue,
  getSensorDataRange,
  getAggregateSensorData,
  getLatestByDevice,
};
