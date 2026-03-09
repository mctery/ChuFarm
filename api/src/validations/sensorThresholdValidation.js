const Joi = require('joi');

const createThresholdSchema = Joi.object({
  sensor_id: Joi.string().required(),
  device_id: Joi.string().required(),
  user_id: Joi.string().required(),
  min_value: Joi.number().allow(null).optional(),
  max_value: Joi.number().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  notify_type: Joi.string().valid('in_app', 'push', 'both').optional(),
}).custom((value, helpers) => {
  if (value.min_value != null && value.max_value != null && value.min_value >= value.max_value) {
    return helpers.error('any.invalid', { message: 'min_value must be less than max_value' });
  }
  return value;
});

const updateThresholdSchema = Joi.object({
  min_value: Joi.number().allow(null).optional(),
  max_value: Joi.number().allow(null).optional(),
  is_active: Joi.boolean().optional(),
  notify_type: Joi.string().valid('in_app', 'push', 'both').optional(),
}).min(1).custom((value, helpers) => {
  if (value.min_value != null && value.max_value != null && value.min_value >= value.max_value) {
    return helpers.error('any.invalid', { message: 'min_value must be less than max_value' });
  }
  return value;
});

module.exports = { createThresholdSchema, updateThresholdSchema };
