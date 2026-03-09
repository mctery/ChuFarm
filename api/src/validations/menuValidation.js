const Joi = require('joi');

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const createMenuSchema = Joi.object({
  key: Joi.string().trim().min(1).max(50).required(),
  name: Joi.string().trim().min(1).max(100).required(),
  path: Joi.string().trim().min(1).max(200).required(),
  icon: Joi.string().trim().max(50).allow(null, '').default(null),
  parent_id: Joi.string().pattern(objectIdPattern).allow(null).default(null),
  order: Joi.number().integer().min(0).default(0),
});

const updateMenuSchema = Joi.object({
  key: Joi.string().trim().min(1).max(50),
  name: Joi.string().trim().min(1).max(100),
  path: Joi.string().trim().min(1).max(200),
  icon: Joi.string().trim().max(50).allow(null, ''),
  parent_id: Joi.string().pattern(objectIdPattern).allow(null),
  order: Joi.number().integer().min(0),
  status: Joi.string().valid('A', 'D'),
}).min(1);

module.exports = {
  createMenuSchema,
  updateMenuSchema,
};
