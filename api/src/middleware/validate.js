/**
 * Creates an Express middleware that validates the specified request property
 * against a Joi schema.
 *
 * @param {import('joi').ObjectSchema} schema - The Joi schema to validate against
 * @param {'body'|'params'|'query'} property - Which part of req to validate
 * @returns {Function} Express middleware
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors: messages,
      });
    }

    // Replace with validated + sanitized value
    req[property] = value;
    next();
  };
}

module.exports = validate;
