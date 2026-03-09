const SensorData = require('../models/sensorDataModel');
const Device = require('../models/deviceModel');
const Farm = require('../models/farmModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { getRecommendations } = require('../services/recommendationEngine');
const { TREND_THRESHOLD_PERCENT } = require('../config');

/**
 * Get summary statistics for a device's sensors.
 * Query: ?period=daily|weekly|monthly (default: daily)
 *        &start_date=ISO&end_date=ISO (optional, default last 7 days)
 */
const getSummary = asyncHandler(async (req, res) => {
  logger.debug('getSummary called');
  const { device_id } = req.params;
  const period = req.query.period || 'daily';

  const end = req.query.end_date ? new Date(req.query.end_date) : new Date();
  const defaultDays = period === 'monthly' ? 30 : period === 'weekly' ? 14 : 7;
  const start = req.query.start_date
    ? new Date(req.query.start_date)
    : new Date(end.getTime() - defaultDays * 24 * 60 * 60 * 1000);

  let dateFormat;
  switch (period) {
    case 'weekly': dateFormat = '%Y-W%V'; break;
    case 'monthly': dateFormat = '%Y-%m'; break;
    default: dateFormat = '%Y-%m-%d';
  }

  const pipeline = [
    { $match: { device_id, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          period: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          sensor_id: '$sensor_id',
          sensor_type: '$sensor',
        },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.period': 1, '_id.sensor_id': 1 } },
  ];

  const results = await SensorData.aggregate(pipeline);

  const byPeriod = {};
  for (const r of results) {
    const p = r._id.period;
    if (!byPeriod[p]) byPeriod[p] = [];
    byPeriod[p].push({
      sensor_id: r._id.sensor_id,
      sensor_type: r._id.sensor_type,
      avg: Math.round(r.avg * 100) / 100,
      min: r.min,
      max: r.max,
      count: r.count,
    });
  }

  res.json({
    message: 'OK',
    data: {
      device_id,
      period,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      summaries: Object.entries(byPeriod).map(([p, sensors]) => ({ period: p, sensors })),
    },
  });
});

/**
 * Detect trends for a device's sensors (rising/falling/stable).
 * Compares last 24h average vs previous 24h average.
 */
const getTrend = asyncHandler(async (req, res) => {
  logger.debug('getTrend called');
  const { device_id } = req.params;

  const now = new Date();
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const pipeline = [
    { $match: { device_id, createdAt: { $gte: h48ago } } },
    {
      $group: {
        _id: {
          sensor_id: '$sensor_id',
          sensor_type: '$sensor',
          window: {
            $cond: [{ $gte: ['$createdAt', h24ago] }, 'current', 'previous'],
          },
        },
        avg: { $avg: '$value' },
        count: { $sum: 1 },
      },
    },
  ];

  const results = await SensorData.aggregate(pipeline);

  // Group by sensor
  const sensorData = {};
  for (const r of results) {
    const key = r._id.sensor_id;
    if (!sensorData[key]) {
      sensorData[key] = { sensor_id: key, sensor_type: r._id.sensor_type };
    }
    sensorData[key][r._id.window] = { avg: r.avg, count: r.count };
  }

  const trends = Object.values(sensorData).map((s) => {
    const current = s.current?.avg;
    const previous = s.previous?.avg;

    let trend = 'stable';
    let change_percent = 0;

    if (current !== undefined && previous !== undefined && previous !== 0) {
      change_percent = Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100;
      if (change_percent > TREND_THRESHOLD_PERCENT) trend = 'rising';
      else if (change_percent < -TREND_THRESHOLD_PERCENT) trend = 'falling';
    }

    return {
      sensor_id: s.sensor_id,
      sensor_type: s.sensor_type,
      current_avg: current !== undefined ? Math.round(current * 100) / 100 : null,
      previous_avg: previous !== undefined ? Math.round(previous * 100) / 100 : null,
      trend,
      change_percent,
    };
  });

  res.json({ message: 'OK', data: { device_id, trends } });
});

/**
 * Compare two devices or two time periods.
 * Query: ?device_id_1=x&device_id_2=y&start_date=ISO&end_date=ISO
 */
const getComparison = asyncHandler(async (req, res) => {
  logger.debug('getComparison called');
  const { device_id_1, device_id_2, start_date, end_date } = req.query;

  if (!device_id_1 || !device_id_2) {
    res.status(400);
    throw new Error('device_id_1 and device_id_2 are required');
  }

  const end = end_date ? new Date(end_date) : new Date();
  const start = start_date ? new Date(start_date) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

  const pipeline = [
    {
      $match: {
        device_id: { $in: [device_id_1, device_id_2] },
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { device_id: '$device_id', sensor_type: '$sensor' },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
      },
    },
  ];

  const results = await SensorData.aggregate(pipeline);

  const grouped = {};
  for (const r of results) {
    const st = r._id.sensor_type;
    if (!grouped[st]) grouped[st] = {};
    grouped[st][r._id.device_id] = {
      avg: Math.round(r.avg * 100) / 100,
      min: r.min,
      max: r.max,
      count: r.count,
    };
  }

  res.json({
    message: 'OK',
    data: {
      device_id_1,
      device_id_2,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      comparison: Object.entries(grouped).map(([sensor_type, devices]) => ({
        sensor_type,
        ...devices,
      })),
    },
  });
});

/**
 * Get recommendations based on latest sensor values.
 * Optionally accepts ?farm_type=greenhouse to use specialized rules.
 */
const getRecommendationsEndpoint = asyncHandler(async (req, res) => {
  logger.debug('getRecommendations called');
  const { device_id } = req.params;

  // Get latest values per sensor (last 1 hour average)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const pipeline = [
    { $match: { device_id, createdAt: { $gte: oneHourAgo } } },
    {
      $group: {
        _id: { sensor_type: '$sensor', sensor_id: '$sensor_id' },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
      },
    },
  ];

  const results = await SensorData.aggregate(pipeline);

  const sensorSummaries = results.map((r) => ({
    sensor_type: r._id.sensor_type,
    sensor_id: r._id.sensor_id,
    avg: r.avg,
    min: r.min,
    max: r.max,
  }));

  // Determine farm type from device's farm (single query with populate)
  let farmType = req.query.farm_type || 'default';
  if (farmType === 'default') {
    const device = await Device.findOne({ device_id }).populate('farm_id', 'farm_type').lean();
    if (device?.farm_id?.farm_type) {
      farmType = device.farm_id.farm_type;
    }
  }

  const recommendations = getRecommendations(sensorSummaries, farmType);

  res.json({
    message: 'OK',
    data: {
      device_id,
      farm_type: farmType,
      sensor_count: sensorSummaries.length,
      recommendations,
    },
  });
});

module.exports = { getSummary, getTrend, getComparison, getRecommendationsEndpoint };
