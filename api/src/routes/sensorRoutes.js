const express = require('express');
const {
  getSensors,
  getSensor,
  getDeviceSensor,
  getDeviceSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
} = require('../controllers/sensorController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const { checkDeviceOwnership } = require('../middleware/ownershipCheck');
const validate = require('../middleware/validate');
const {
  createSensorSchema,
  updateSensorSchema,
} = require('../validations/sensorValidation');

const router = express.Router();

router.use(verifyToken);

// Device-scoped sensor routes (ownership checked via device_id in params)
router.get('/device/type/:id/:type', checkPermission('sensors:read'), checkDeviceOwnership('params'), getDeviceSensor);
router.get('/device/:id', checkPermission('sensors:read'), checkDeviceOwnership('params'), getDeviceSensorById);

router
  .route('/')
  .get(checkPermission('sensors:read'), getSensors)
  .post(checkPermission('sensors:write'), validate(createSensorSchema), checkDeviceOwnership('body'), createSensor);

router
  .route('/:id')
  .get(checkPermission('sensors:read'), getSensor)
  .put(checkPermission('sensors:write'), validate(updateSensorSchema), updateSensor)
  .delete(checkPermission('sensors:delete'), deleteSensor);

module.exports = router;
