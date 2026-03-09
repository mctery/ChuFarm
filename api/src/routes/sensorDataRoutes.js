const express = require('express');
const {
  createSensorDataValue,
  getSensorData,
  getSensorDataRange,
  getAggregateSensorData,
  getLatestByDevice,
} = require('../controllers/sensorDataController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { checkDeviceOwnership } = require('../middleware/ownershipCheck');
const {
  getSensorDataSchema,
  getSensorDataRangeSchema,
  createSensorDataValueSchema,
  aggregateSensorDataSchema,
} = require('../validations/sensorDataValidation');

const router = express.Router();

router.use(verifyToken);

router.route('/find').post(
  checkPermission('sensor_data:read'),
  validate(getSensorDataSchema),
  checkDeviceOwnership('body'),
  getSensorData
);

router.route('/range').post(
  checkPermission('sensor_data:read'),
  validate(getSensorDataRangeSchema),
  checkDeviceOwnership('body'),
  getSensorDataRange
);

router.route('/create').post(
  checkPermission('sensor_data:write'),
  validate(createSensorDataValueSchema),
  checkDeviceOwnership('body'),
  createSensorDataValue
);

router.route('/aggregate').post(
  checkPermission('sensor_data:read'),
  validate(aggregateSensorDataSchema),
  checkDeviceOwnership('body'),
  getAggregateSensorData
);

router.route('/latest/:deviceId').get(
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  getLatestByDevice
);

module.exports = router;
