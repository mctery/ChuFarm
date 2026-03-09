const Joi = require('joi');

const cityParamSchema = Joi.object({
  city: Joi.string()
    .trim()
    .min(1)
    .max(100)
    .required()
    .pattern(/^[a-zA-Z\s\-'.]+$/)
    .messages({
      'string.pattern.base':
        'City name must contain only letters, spaces, hyphens, apostrophes, and periods',
    }),
});

module.exports = {
  cityParamSchema,
};
