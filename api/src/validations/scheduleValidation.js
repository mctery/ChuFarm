const Joi = require('joi');

const actionSchema = Joi.object({
  type: Joi.string().valid('device_command', 'send_notification', 'log_event').required(),
  device_id: Joi.string().when('type', { is: 'device_command', then: Joi.required() }),
  command: Joi.string().when('type', { is: 'device_command', then: Joi.required() }),
  payload: Joi.object().default({}),
  message: Joi.string().allow('').optional(),
});

const createScheduleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  cron_expression: Joi.string().min(5).max(100).required(),
  timezone: Joi.string().max(50).default('Asia/Bangkok'),
  actions: Joi.array().items(actionSchema).min(1).required(),
  is_active: Joi.boolean().default(true),
  start_date: Joi.date().iso().allow(null).optional(),
  end_date: Joi.date().iso().allow(null).optional(),
}).custom((value, helpers) => {
  if (value.start_date && value.end_date && value.start_date >= value.end_date) {
    return helpers.error('any.invalid', { message: 'start_date must be before end_date' });
  }
  return value;
});

const updateScheduleSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
  cron_expression: Joi.string().min(5).max(100),
  timezone: Joi.string().max(50),
  actions: Joi.array().items(actionSchema).min(1),
  is_active: Joi.boolean(),
  start_date: Joi.date().iso().allow(null),
  end_date: Joi.date().iso().allow(null),
}).min(1);

module.exports = { createScheduleSchema, updateScheduleSchema };
