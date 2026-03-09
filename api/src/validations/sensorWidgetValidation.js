const Joi = require('joi');

const createSensorWidgetSchema = Joi.object({
  device_id: Joi.string().required(),
  widget_json: Joi.string().optional(),
});

module.exports = {
  createSensorWidgetSchema,
};
