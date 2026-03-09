const Joi = require('joi');

const updateUserSettingSchema = Joi.object({
  timezone: Joi.string().max(50).optional(),
  language: Joi.string().valid('th', 'en').optional(),
  notification: Joi.object({
    email: Joi.boolean().optional(),
    push: Joi.boolean().optional(),
    in_app: Joi.boolean().optional(),
  }).optional(),
  dashboard: Joi.object({
    refresh_interval: Joi.number().integer().min(5).max(300).optional(),
  }).optional(),
}).min(1);

module.exports = { updateUserSettingSchema };
