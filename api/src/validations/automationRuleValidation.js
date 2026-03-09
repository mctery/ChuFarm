const Joi = require('joi');

const conditionSchema = Joi.object({
  type: Joi.string().valid('sensor_value', 'device_status').required(),
  device_id: Joi.string().required(),
  sensor_id: Joi.string().when('type', { is: 'sensor_value', then: Joi.required() }),
  operator: Joi.string().valid('gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between').required(),
  value: Joi.alternatives()
    .try(
      Joi.number(),
      Joi.array().items(Joi.number()).length(2) // for 'between'
    )
    .required(),
  logic: Joi.string().valid('AND', 'OR').default('AND'),
});

const actionSchema = Joi.object({
  type: Joi.string().valid('device_command', 'send_notification', 'log_event').required(),
  device_id: Joi.string().when('type', { is: 'device_command', then: Joi.required() }),
  command: Joi.string().when('type', { is: 'device_command', then: Joi.required() }),
  payload: Joi.object().default({}),
  message: Joi.string().allow('').optional(),
  delay_seconds: Joi.number().integer().min(0).max(300).default(0),
});

const createRuleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  is_active: Joi.boolean().default(true),
  trigger_type: Joi.string().valid('sensor_threshold', 'device_event').required(),
  conditions: Joi.array().items(conditionSchema).min(1).required(),
  actions: Joi.array().items(actionSchema).min(1).required(),
  cooldown_seconds: Joi.number().integer().min(0).max(86400).default(300),
  priority: Joi.number().integer().min(0).max(100).default(0),
});

const updateRuleSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
  is_active: Joi.boolean(),
  trigger_type: Joi.string().valid('sensor_threshold', 'device_event'),
  conditions: Joi.array().items(conditionSchema).min(1),
  actions: Joi.array().items(actionSchema).min(1),
  cooldown_seconds: Joi.number().integer().min(0).max(86400),
  priority: Joi.number().integer().min(0).max(100),
}).min(1);

const testRuleSchema = Joi.object({
  sensor_data: Joi.array()
    .items(
      Joi.object({
        device_id: Joi.string().required(),
        sensor_id: Joi.string().required(),
        value: Joi.number().required(),
      })
    )
    .min(1)
    .required(),
});

module.exports = { createRuleSchema, updateRuleSchema, testRuleSchema };
