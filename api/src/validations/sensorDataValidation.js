const Joi = require('joi');

const MAX_DATE_RANGE_DAYS = 31;

const getSensorDataSchema = Joi.object({
  device_id: Joi.string().required(),
  sensor: Joi.string().required(),
});

const getSensorDataRangeSchema = Joi.object({
  device_id: Joi.string().required(),
  sensor: Joi.string().required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate) {
    const diffMs = new Date(value.endDate) - new Date(value.startDate);
    if (diffMs < 0) return helpers.error('any.invalid', { message: 'endDate must be after startDate' });
    if (diffMs > MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      return helpers.error('any.invalid', { message: `Date range must not exceed ${MAX_DATE_RANGE_DAYS} days` });
    }
  }
  return value;
});

const createSensorDataValueSchema = Joi.object({
  device_id: Joi.string().required(),
  dataset: Joi.array()
    .items(
      Joi.object({
        id: Joi.string().required(),
        sensor: Joi.string().required(),
        value: Joi.number().required(),
      })
    )
    .min(1)
    .required(),
});

const aggregateSensorDataSchema = Joi.object({
  device_id: Joi.string().required(),
  sensor: Joi.string().required(),
  sensor_id: Joi.string().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  groupBy: Joi.string().valid('day', 'hour').default('hour'),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate) {
    const diffMs = new Date(value.endDate) - new Date(value.startDate);
    if (diffMs < 0) return helpers.error('any.invalid', { message: 'endDate must be after startDate' });
    if (diffMs > MAX_DATE_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      return helpers.error('any.invalid', { message: `Date range must not exceed ${MAX_DATE_RANGE_DAYS} days` });
    }
  }
  return value;
});

module.exports = {
  getSensorDataSchema,
  getSensorDataRangeSchema,
  createSensorDataValueSchema,
  aggregateSensorDataSchema,
};
