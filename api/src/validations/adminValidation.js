const Joi = require('joi');
const { PERMISSIONS } = require('../config/permissions');

const allPermissionValues = Object.values(PERMISSIONS);

const updateRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'user').required(),
});

const updatePermissionsSchema = Joi.object({
  permissions: Joi.array()
    .items(Joi.string().valid('*', ...allPermissionValues))
    .required(),
});

const updateUserMenusSchema = Joi.object({
  menu_ids: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .required(),
});

const createNotificationSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  message: Joi.string().min(1).max(2000).required(),
  severity: Joi.string().valid('info', 'warning', 'critical').default('info'),
});

const updateDeviceSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  version: Joi.string().max(20),
}).min(1);

const updateSensorSchema = Joi.object({
  sensor_name: Joi.string().allow('', null),
  unit: Joi.string().allow('', null),
  max: Joi.number().allow(null),
  min: Joi.number().allow(null),
  ratio: Joi.string().allow('', null),
  bgcolor: Joi.string().allow('', null),
}).min(1);

const objectId = Joi.string().pattern(/^[0-9a-fA-F]{24}$/);

const bulkRoleSchema = Joi.object({
  user_ids: Joi.array().items(objectId).min(1).required(),
  role: Joi.string().valid('admin', 'user').required(),
});

const bulkDeleteUsersSchema = Joi.object({
  user_ids: Joi.array().items(objectId).min(1).required(),
});

const bulkDeleteDevicesSchema = Joi.object({
  device_ids: Joi.array().items(objectId).min(1).required(),
});

module.exports = {
  updateRoleSchema,
  updatePermissionsSchema,
  updateUserMenusSchema,
  createNotificationSchema,
  updateDeviceSchema,
  updateSensorSchema,
  bulkRoleSchema,
  bulkDeleteUsersSchema,
  bulkDeleteDevicesSchema,
};
