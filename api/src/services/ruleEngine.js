const AutomationRule = require('../models/automationRuleModel');
const RuleExecutionLog = require('../models/ruleExecutionLogModel');
const logger = require('../config/logger');
const { STATUS } = require('../config');
const { executeActions } = require('./actionExecutor');

/**
 * Evaluate a single condition against current sensor data.
 */
function evaluateCondition(condition, sensorMap) {
  if (condition.type !== 'sensor_value') return false;

  const key = `${condition.device_id}:${condition.sensor_id}`;
  const currentValue = sensorMap.get(key);
  if (currentValue === undefined) return false;

  switch (condition.operator) {
    case 'gt': return currentValue > condition.value;
    case 'gte': return currentValue >= condition.value;
    case 'lt': return currentValue < condition.value;
    case 'lte': return currentValue <= condition.value;
    case 'eq': return currentValue === condition.value;
    case 'neq': return currentValue !== condition.value;
    case 'between': {
      if (!Array.isArray(condition.value) || condition.value.length !== 2) return false;
      return currentValue >= condition.value[0] && currentValue <= condition.value[1];
    }
    default: return false;
  }
}

/**
 * Evaluate conditions with proper AND/OR grouping.
 *
 * Each condition's `logic` field defines how it connects to the NEXT condition.
 * - Split into OR-separated groups
 * - Within each group, all conditions must be true (AND)
 * - Between groups, any group being true satisfies (OR)
 *
 * Example: [A(AND), B(OR), C(AND), D]
 *   -> Group 1: [A, B] (AND) | Group 2: [C, D] (AND)
 *   -> Result: Group1 OR Group2
 */
function evaluateConditions(conditions, sensorMap) {
  if (conditions.length === 0) return false;

  const groups = [[]];
  for (let i = 0; i < conditions.length; i++) {
    groups[groups.length - 1].push(conditions[i]);
    if (conditions[i].logic === 'OR' && i < conditions.length - 1) {
      groups.push([]);
    }
  }

  return groups.some((group) =>
    group.every((c) => evaluateCondition(c, sensorMap))
  );
}

/**
 * Process automation rules for a given device after sensor data arrives.
 */
async function processRules(deviceId, sensorDocs) {
  try {
    const rules = await AutomationRule.find({
      'conditions.device_id': deviceId,
      is_active: true,
      status: STATUS.ACTIVE,
    });

    if (rules.length === 0) return;

    const sensorMap = new Map();
    for (const doc of sensorDocs) {
      sensorMap.set(`${doc.device_id}:${doc.sensor_id}`, doc.value);
    }

    const now = Date.now();

    for (const rule of rules) {
      if (rule.last_triggered) {
        const elapsed = now - rule.last_triggered.getTime();
        if (elapsed < rule.cooldown_seconds * 1000) {
          logger.debug('Rule skipped (cooldown)', { rule_id: rule._id });
          continue;
        }
      }

      if (!evaluateConditions(rule.conditions, sensorMap)) continue;

      const startTime = Date.now();
      const { results: actionResults, status: logStatus } = await executeActions(
        rule.actions, rule, 'rule'
      );
      const duration = Date.now() - startTime;

      await AutomationRule.findByIdAndUpdate(rule._id, { last_triggered: new Date() });

      await RuleExecutionLog.create({
        rule_id: rule._id,
        rule_name: rule.name,
        trigger_type: 'rule',
        trigger_data: {
          device_id: deviceId,
          sensors: sensorDocs.map((d) => ({ sensor_id: d.sensor_id, value: d.value })),
        },
        actions_executed: actionResults,
        status: logStatus,
        duration_ms: duration,
        user_id: rule.user_id,
      });

      logger.info('Automation rule executed', {
        rule_id: rule._id,
        rule_name: rule.name,
        status: logStatus,
        duration_ms: duration,
      });
    }
  } catch (err) {
    logger.error('Rule engine error', { error: err.message });
  }
}

module.exports = { processRules, evaluateCondition, evaluateConditions };
