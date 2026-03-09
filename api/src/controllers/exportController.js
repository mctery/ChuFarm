const SensorData = require('../models/sensorDataModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { EXPORT } = require('../config');

/**
 * Parse and validate date range from query params.
 */
function parseDateRange(query) {
  const { start_date, end_date } = query;
  if (!start_date || !end_date) {
    throw new Error('start_date and end_date are required');
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > EXPORT.maxDays) {
    throw new Error(`Date range cannot exceed ${EXPORT.maxDays} days`);
  }
  if (diffDays < 0) {
    throw new Error('end_date must be after start_date');
  }

  return { start, end };
}

/**
 * Build filter from query params.
 */
function buildFilter(deviceId, query, start, end) {
  const filter = {
    device_id: deviceId,
    createdAt: { $gte: start, $lte: end },
  };
  if (query.sensor_type) filter.sensor = query.sensor_type;
  if (query.sensor_id) filter.sensor_id = query.sensor_id;
  return filter;
}

const exportCSV = asyncHandler(async (req, res) => {
  logger.debug('exportCSV called');
  const { device_id } = req.params;
  const { start, end } = parseDateRange(req.query);
  const filter = buildFilter(device_id, req.query, start, end);

  const data = await SensorData.find(filter)
    .sort({ createdAt: 1 })
    .limit(EXPORT.maxRows)
    .lean();

  // Build CSV
  const header = 'timestamp,device_id,sensor_id,sensor_type,value';
  const rows = data.map((d) =>
    `${d.createdAt.toISOString()},${d.device_id},${d.sensor_id},${d.sensor},${d.value}`
  );

  const csv = [header, ...rows].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=sensor_data_${device_id}_${req.query.start_date}.csv`);
  res.send(csv);
});

const exportJSON = asyncHandler(async (req, res) => {
  logger.debug('exportJSON called');
  const { device_id } = req.params;
  const { start, end } = parseDateRange(req.query);
  const filter = buildFilter(device_id, req.query, start, end);

  const data = await SensorData.find(filter)
    .sort({ createdAt: 1 })
    .limit(EXPORT.maxRows)
    .lean();

  res.json({
    message: 'OK',
    data: {
      device_id,
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      count: data.length,
      records: data.map((d) => ({
        timestamp: d.createdAt,
        sensor_id: d.sensor_id,
        sensor_type: d.sensor,
        value: d.value,
      })),
    },
  });
});

const getDailySummary = asyncHandler(async (req, res) => {
  logger.debug('getDailySummary called');
  const { device_id } = req.params;
  const { start, end } = parseDateRange(req.query);

  const pipeline = [
    {
      $match: {
        device_id,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sensor_id: '$sensor_id',
          sensor_type: '$sensor',
        },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.date': 1, '_id.sensor_id': 1 } },
  ];

  const results = await SensorData.aggregate(pipeline);

  // Group by date
  const byDate = {};
  for (const r of results) {
    const date = r._id.date;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push({
      sensor_id: r._id.sensor_id,
      sensor_type: r._id.sensor_type,
      avg: Math.round(r.avg * 100) / 100,
      min: r.min,
      max: r.max,
      count: r.count,
    });
  }

  const summaries = Object.entries(byDate).map(([date, sensors]) => ({
    date,
    sensors,
  }));

  res.json({ message: 'OK', data: { device_id, summaries } });
});

const getWeeklySummary = asyncHandler(async (req, res) => {
  logger.debug('getWeeklySummary called');
  const { device_id } = req.params;
  const { start, end } = parseDateRange(req.query);

  const pipeline = [
    {
      $match: {
        device_id,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          week: { $isoWeek: '$createdAt' },
          year: { $isoWeekYear: '$createdAt' },
          sensor_id: '$sensor_id',
          sensor_type: '$sensor',
        },
        avg: { $avg: '$value' },
        min: { $min: '$value' },
        max: { $max: '$value' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.week': 1, '_id.sensor_id': 1 } },
  ];

  const results = await SensorData.aggregate(pipeline);

  const byWeek = {};
  for (const r of results) {
    const key = `${r._id.year}-W${String(r._id.week).padStart(2, '0')}`;
    if (!byWeek[key]) byWeek[key] = [];
    byWeek[key].push({
      sensor_id: r._id.sensor_id,
      sensor_type: r._id.sensor_type,
      avg: Math.round(r.avg * 100) / 100,
      min: r.min,
      max: r.max,
      count: r.count,
    });
  }

  const summaries = Object.entries(byWeek).map(([week, sensors]) => ({
    week,
    sensors,
  }));

  res.json({ message: 'OK', data: { device_id, summaries } });
});

module.exports = { exportCSV, exportJSON, getDailySummary, getWeeklySummary };
