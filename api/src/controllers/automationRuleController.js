const AutomationRule = require('../models/automationRuleModel');
const RuleExecutionLog = require('../models/ruleExecutionLogModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { paginateQuery } = require('../utils/pagination');
const { evaluateConditions } = require('../services/ruleEngine');
const { findAndAuthorize } = require('../utils/errors');

const RULE_OPTS = { name: 'Rule' };

const getRules = asyncHandler(async (req, res) => {
  logger.debug('getRules called');
  const filter = { user_id: req.User_name.userId, status: STATUS.ACTIVE };
  if (req.query.is_active !== undefined) {
    filter.is_active = req.query.is_active === 'true';
  }
  const result = await paginateQuery(AutomationRule, filter, req.query, { defaultLimit: 0 });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getRule = asyncHandler(async (req, res) => {
  logger.debug('getRule called');
  const rule = await findAndAuthorize(res, req, AutomationRule, req.params.id, RULE_OPTS);
  res.json({ message: 'OK', data: rule });
});

const createRule = asyncHandler(async (req, res) => {
  logger.debug('createRule called');
  req.body.user_id = req.User_name.userId;
  req.body.status = STATUS.ACTIVE;
  const rule = await AutomationRule.create(req.body);
  res.status(201).json({ message: 'OK', data: rule });
});

const updateRule = asyncHandler(async (req, res) => {
  logger.debug('updateRule called');
  await findAndAuthorize(res, req, AutomationRule, req.params.id, RULE_OPTS);
  const updated = await AutomationRule.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.json({ message: 'OK', data: updated });
});

const deleteRule = asyncHandler(async (req, res) => {
  logger.debug('deleteRule called');
  await findAndAuthorize(res, req, AutomationRule, req.params.id, RULE_OPTS);
  await AutomationRule.findByIdAndUpdate(req.params.id, { status: STATUS.DELETED, is_active: false });
  res.json({ message: 'OK', data: 'Rule deleted' });
});

const toggleRule = asyncHandler(async (req, res) => {
  logger.debug('toggleRule called');
  const rule = await findAndAuthorize(res, req, AutomationRule, req.params.id, RULE_OPTS);
  const updated = await AutomationRule.findByIdAndUpdate(
    req.params.id,
    { is_active: !rule.is_active },
    { new: true }
  );
  res.json({ message: 'OK', data: updated });
});

const testRule = asyncHandler(async (req, res) => {
  logger.debug('testRule called (dry-run)');
  const rule = await findAndAuthorize(res, req, AutomationRule, req.params.id, RULE_OPTS);

  const testData = req.body.sensor_data || [];
  const sensorMap = new Map();
  for (const item of testData) {
    sensorMap.set(`${item.device_id}:${item.sensor_id}`, item.value);
  }

  const conditionsMet = evaluateConditions(rule.conditions, sensorMap);

  res.json({
    message: 'OK',
    data: {
      rule_name: rule.name,
      conditions_met: conditionsMet,
      conditions: rule.conditions,
      actions_that_would_execute: conditionsMet ? rule.actions : [],
      note: 'This is a dry-run — no actions were executed',
    },
  });
});

const getRuleExecutionLogs = asyncHandler(async (req, res) => {
  logger.debug('getRuleExecutionLogs called');
  await findAndAuthorize(res, req, AutomationRule, req.params.id, RULE_OPTS);
  const filter = { rule_id: req.params.id };
  const result = await paginateQuery(RuleExecutionLog, filter, req.query, {
    defaultLimit: 20,
    defaultSort: { createdAt: -1 },
  });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

module.exports = {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  testRule,
  getRuleExecutionLogs,
};
