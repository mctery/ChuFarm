const Joi = require('joi');

const passwordSchema = Joi.string()
  .min(8)
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'number')
  .required()
  .messages({
    'string.min': 'Password must be at least 8 characters',
    'string.pattern.name': 'Password must contain at least one {#name} character',
    'any.required': 'Password is required',
  });

const registerSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: passwordSchema,
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateUserSchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100),
  last_name: Joi.string().trim().min(1).max(100),
  email: Joi.string().email(),
  password: passwordSchema.optional(),
}).min(1);

const checkTokenSchema = Joi.object({
  token: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: passwordSchema,
});

module.exports = {
  registerSchema,
  loginSchema,
  updateUserSchema,
  checkTokenSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
