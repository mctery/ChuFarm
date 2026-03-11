const Notification = require('../models/notificationModel');
const logger = require('../config/logger');
const { emitToUser } = require('../config/socketio');

let mqttClient = null;

function setMqttClient(client) {
  mqttClient = client;
}

/**
 * Validate device_id format to prevent MQTT topic injection.
 */
function isValidDeviceId(deviceId) {
  return typeof deviceId === 'string' && /^[a-zA-Z0-9_-]+$/.test(deviceId);
}

/**
 * Execute a single action (shared by ruleEngine and scheduleEngine).
 * @param {Object} action - Action definition
 * @param {Object} context - { _id, name, user_id } (rule or schedule)
 * @param {string} source - 'rule' or 'schedule' for logging
 * @returns {{ type, device_id, command, status, error? }}
 */
async function executeAction(action, context, source = 'rule') {
  const result = {
    type: action.type,
    device_id: action.device_id || null,
    command: action.command || null,
    status: 'success',
  };

  try {
    if (action.delay_seconds && action.delay_seconds > 0) {
      await new Promise((resolve) => setTimeout(resolve, action.delay_seconds * 1000));
    }

    switch (action.type) {
      case 'device_command': {
        if (!mqttClient) throw new Error('MQTT client not available');
        if (!isValidDeviceId(action.device_id)) throw new Error('Invalid device_id format');

        const topic = `request/${action.device_id}/${action.command}`;
        mqttClient.publish(topic, JSON.stringify(action.payload || {}));
        logger.info(`${source} action: device command sent`, {
          id: context._id,
          topic,
        });
        break;
      }

      case 'send_notification': {
        await Notification.create({
          user_id: context.user_id,
          device_id: action.device_id,
          type: 'system',
          title: `${source === 'schedule' ? 'Schedule' : 'Automation'}: ${context.name}`,
          message: action.message || `${context.name} triggered`,
          severity: 'info',
        });
        emitToUser(context.user_id, 'new_notification', { count: 1 });
        logger.info(`${source} action: notification sent`, { id: context._id });
        break;
      }

      case 'log_event': {
        logger.info(`${source} action: log event`, {
          id: context._id,
          name: context.name,
          message: action.message,
        });
        break;
      }

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  } catch (err) {
    result.status = 'failed';
    result.error = err.message;
    logger.error(`${source} action failed`, {
      id: context._id,
      action_type: action.type,
      error: err.message,
    });
  }

  return result;
}

/**
 * Execute multiple actions in parallel and return results + overall status.
 */
async function executeActions(actions, context, source = 'rule') {
  const results = await Promise.all(
    actions.map((action) => executeAction(action, context, source))
  );

  const allSuccess = results.every((r) => r.status === 'success');
  const anySuccess = results.some((r) => r.status === 'success');
  let status = 'failed';
  if (allSuccess) status = 'success';
  else if (anySuccess) status = 'partial';

  return { results, status };
}

module.exports = { executeAction, executeActions, setMqttClient };
