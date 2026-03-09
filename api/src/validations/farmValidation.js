const Joi = require('joi');

const locationSchema = Joi.object({
  address: Joi.string().max(500).allow('').optional(),
  lat: Joi.number().min(-90).max(90).allow(null).optional(),
  lng: Joi.number().min(-180).max(180).allow(null).optional(),
});

const createFarmSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  location: locationSchema.optional(),
  image: Joi.string().max(500).allow('').optional(),
  farm_type: Joi.string().valid('greenhouse', 'openfield', 'indoor', 'hydroponic', 'other').optional(),
  total_area: Joi.number().min(0).allow(null).optional(),
});

const updateFarmSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500).allow(''),
  location: locationSchema,
  image: Joi.string().max(500).allow(''),
  farm_type: Joi.string().valid('greenhouse', 'openfield', 'indoor', 'hydroponic', 'other'),
  total_area: Joi.number().min(0).allow(null),
}).min(1);

module.exports = { createFarmSchema, updateFarmSchema };
