const Joi = require('joi');

const createSensorSchema = Joi.object({
  user_id: Joi.string().optional(),
  device_id: Joi.string().required(),
  sensor_name: Joi.string().trim().max(200).optional(),
  sensor_type: Joi.string().trim().required(),
  sensor_id: Joi.string().trim().optional(),
  unit: Joi.string().trim().max(20).optional(),
  max: Joi.number().allow(null).optional(),
  min: Joi.number().allow(null).optional(),
  ratio: Joi.string().trim().allow(null, '').max(20).optional(),
  bgcolor: Joi.string().trim().max(20).default('#ecf0f1'),
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('A', 'D')).optional(),
});

const updateSensorSchema = Joi.object({
  sensor_name: Joi.string().trim().max(200),
  sensor_type: Joi.string().trim(),
  sensor_id: Joi.string().trim(),
  unit: Joi.string().trim().max(20),
  max: Joi.number().allow(null),
  min: Joi.number().allow(null),
  ratio: Joi.string().trim().allow(null, '').max(20),
  bgcolor: Joi.string().trim().max(20),
  status: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('A', 'D')),
}).min(1);

module.exports = {
  createSensorSchema,
  updateSensorSchema,
};
