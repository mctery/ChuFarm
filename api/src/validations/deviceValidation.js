const Joi = require('joi');

const createDeviceSchema = Joi.object({
  device_id: Joi.string().trim().required(),
  name: Joi.string().trim().min(1).max(200).required(),
  version: Joi.string().trim().max(20).default('1.0'),
  image: Joi.string().allow('').default(''),
});

const updateDeviceSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200),
  version: Joi.string().trim().max(20),
  image: Joi.string().allow(''),
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('A', 'D')),
  online_status: Joi.boolean(),
}).min(1);

const sendCommandSchema = Joi.object({
  command: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base':
        'Command must contain only alphanumeric characters, hyphens, and underscores',
    }),
  payload: Joi.object().unknown(true).default({}),
});

module.exports = {
  createDeviceSchema,
  updateDeviceSchema,
  sendCommandSchema,
};
