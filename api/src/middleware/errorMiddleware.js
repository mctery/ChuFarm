const { nodeEnv } = require('../config');
const logger = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  if (err.isJoi) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: err.details.map((d) => d.message),
    });
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  logger.error('Unhandled error', { message: err.message, statusCode, url: req.originalUrl });
  res.status(statusCode).json({
    message: err.message,
    stack: nodeEnv === 'development' ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
