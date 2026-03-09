const Joi = require('joi');

const createZoneSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  zone_type: Joi.string().valid('greenhouse', 'field', 'nursery', 'storage', 'other').optional(),
  area: Joi.number().min(0).allow(null).optional(),
  crop_type: Joi.string().max(100).allow('').optional(),
  image: Joi.string().max(500).allow('').optional(),
});

const updateZoneSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
  zone_type: Joi.string().valid('greenhouse', 'field', 'nursery', 'storage', 'other'),
  area: Joi.number().min(0).allow(null),
  crop_type: Joi.string().max(100).allow(''),
  image: Joi.string().max(500).allow(''),
}).min(1);

module.exports = { createZoneSchema, updateZoneSchema };
