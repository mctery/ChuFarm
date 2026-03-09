const cron = require('node-cron');
const Schedule = require('../models/scheduleModel');
const RuleExecutionLog = require('../models/ruleExecutionLogModel');
const logger = require('../config/logger');
const { DEFAULT_TIMEZONE, STATUS } = require('../config');
const { executeActions } = require('./actionExecutor');

/** Map of schedule._id → cron task (for stop/restart) */
const activeTasks = new Map();

/**
 * Run a schedule — execute all its actions and log the result.
 */
async function runSchedule(schedule) {
  const startTime = Date.now();

  try {
    // Check date bounds
    const now = new Date();
    if (schedule.start_date && now < schedule.start_date) return;
    if (schedule.end_date && now > schedule.end_date) {
      // Schedule expired — deactivate and stop cron
      await Schedule.findByIdAndUpdate(schedule._id, { is_active: false });
      stopSchedule(schedule._id.toString());
      logger.info('Schedule expired and deactivated', { schedule_id: schedule._id });
      return;
    }

    const { results: actionResults, status: logStatus } = await executeActions(
      schedule.actions, schedule, 'schedule'
    );
    const duration = Date.now() - startTime;

    // Update last_run
    await Schedule.findByIdAndUpdate(schedule._id, { last_run: new Date() });

    // Log execution
    await RuleExecutionLog.create({
      rule_id: schedule._id,
      rule_name: schedule.name,
      trigger_type: 'schedule',
      trigger_data: { cron: schedule.cron_expression },
      actions_executed: actionResults,
      status: logStatus,
      duration_ms: duration,
      user_id: schedule.user_id,
    });

    logger.info('Schedule executed', {
      schedule_id: schedule._id,
      schedule_name: schedule.name,
      status: logStatus,
      duration_ms: duration,
    });
  } catch (err) {
    logger.error('Schedule execution error', {
      schedule_id: schedule._id,
      error: err.message,
    });
  }
}

/**
 * Start a cron job for a schedule.
 */
function startSchedule(schedule) {
  const id = schedule._id.toString();

  // Stop existing task if running
  if (activeTasks.has(id)) {
    activeTasks.get(id).stop();
    activeTasks.delete(id);
  }

  if (!cron.validate(schedule.cron_expression)) {
    logger.error('Invalid cron expression', {
      schedule_id: id,
      cron: schedule.cron_expression,
    });
    return;
  }

  const task = cron.schedule(
    schedule.cron_expression,
    () => runSchedule(schedule),
    { timezone: schedule.timezone || DEFAULT_TIMEZONE }
  );

  activeTasks.set(id, task);
  logger.debug('Schedule started', { schedule_id: id, cron: schedule.cron_expression });
}

/**
 * Stop a cron job for a schedule.
 */
function stopSchedule(scheduleId) {
  const id = scheduleId.toString();
  if (activeTasks.has(id)) {
    activeTasks.get(id).stop();
    activeTasks.delete(id);
    logger.debug('Schedule stopped', { schedule_id: id });
  }
}

/**
 * Load all active schedules from DB and start their cron jobs.
 * Called once at server startup.
 */
async function initSchedules() {
  try {
    const schedules = await Schedule.find({ is_active: true, status: STATUS.ACTIVE });
    logger.info(`Loading ${schedules.length} active schedule(s)`);

    for (const schedule of schedules) {
      startSchedule(schedule);
    }
  } catch (err) {
    logger.error('Failed to init schedules', { error: err.message });
  }
}

/**
 * Stop all active cron jobs (for graceful shutdown).
 */
function stopAllSchedules() {
  for (const [id, task] of activeTasks) {
    task.stop();
  }
  activeTasks.clear();
  logger.info('All schedules stopped');
}

module.exports = {
  startSchedule,
  stopSchedule,
  initSchedules,
  stopAllSchedules,
  runSchedule,
};
