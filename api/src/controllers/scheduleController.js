const Schedule = require('../models/scheduleModel');
const RuleExecutionLog = require('../models/ruleExecutionLogModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { paginateQuery } = require('../utils/pagination');
const { startSchedule, stopSchedule } = require('../services/scheduleEngine');
const { findAndAuthorize } = require('../utils/errors');
const cron = require('node-cron');

const SCHED_OPTS = { name: 'Schedule' };

const getSchedules = asyncHandler(async (req, res) => {
  logger.debug('getSchedules called');
  const filter = { user_id: req.User_name.userId, status: STATUS.ACTIVE };
  if (req.query.is_active !== undefined) {
    filter.is_active = req.query.is_active === 'true';
  }
  const result = await paginateQuery(Schedule, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getSchedule = asyncHandler(async (req, res) => {
  logger.debug('getSchedule called');
  const schedule = await findAndAuthorize(res, req, Schedule, req.params.id, SCHED_OPTS);
  res.json({ message: 'OK', data: schedule });
});

const createSchedule = asyncHandler(async (req, res) => {
  logger.debug('createSchedule called');
  if (!cron.validate(req.body.cron_expression)) {
    res.status(400);
    throw new Error('Invalid cron expression');
  }

  req.body.user_id = req.User_name.userId;
  req.body.status = STATUS.ACTIVE;
  const schedule = await Schedule.create(req.body);

  if (schedule.is_active) {
    startSchedule(schedule);
  }

  res.status(201).json({ message: 'OK', data: schedule });
});

const updateSchedule = asyncHandler(async (req, res) => {
  logger.debug('updateSchedule called');
  await findAndAuthorize(res, req, Schedule, req.params.id, SCHED_OPTS);

  if (req.body.cron_expression) {
    if (!cron.validate(req.body.cron_expression)) {
      res.status(400);
      throw new Error('Invalid cron expression');
    }
  }

  const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  stopSchedule(req.params.id);
  if (updated.is_active) {
    startSchedule(updated);
  }

  res.json({ message: 'OK', data: updated });
});

const deleteSchedule = asyncHandler(async (req, res) => {
  logger.debug('deleteSchedule called');
  await findAndAuthorize(res, req, Schedule, req.params.id, SCHED_OPTS);
  await Schedule.findByIdAndUpdate(req.params.id, { status: STATUS.DELETED, is_active: false });
  stopSchedule(req.params.id);
  res.json({ message: 'OK', data: 'Schedule deleted' });
});

const toggleSchedule = asyncHandler(async (req, res) => {
  logger.debug('toggleSchedule called');
  const schedule = await findAndAuthorize(res, req, Schedule, req.params.id, SCHED_OPTS);

  const newActive = !schedule.is_active;
  const updated = await Schedule.findByIdAndUpdate(
    req.params.id,
    { is_active: newActive },
    { new: true }
  );

  if (newActive) {
    startSchedule(updated);
  } else {
    stopSchedule(req.params.id);
  }

  res.json({ message: 'OK', data: updated });
});

const getScheduleExecutionLogs = asyncHandler(async (req, res) => {
  logger.debug('getScheduleExecutionLogs called');
  await findAndAuthorize(res, req, Schedule, req.params.id, SCHED_OPTS);
  const filter = { rule_id: req.params.id, trigger_type: 'schedule' };
  const result = await paginateQuery(RuleExecutionLog, filter, req.query, {
    defaultLimit: 20,
    defaultSort: { createdAt: -1 },
  });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

module.exports = {
  getSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  toggleSchedule,
  getScheduleExecutionLogs,
};
