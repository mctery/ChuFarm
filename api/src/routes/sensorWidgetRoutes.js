const express = require('express');
const {
  getSensorWidget,
  createSensorWidget,
  updateSensorWidget,
  deleteSensorWidget,
} = require('../controllers/sensorWidgetController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const { checkDeviceOwnership } = require('../middleware/ownershipCheck');
const validate = require('../middleware/validate');
const {
  createSensorWidgetSchema,
} = require('../validations/sensorWidgetValidation');

const router = express.Router();

router.use(verifyToken);

router
  .route('/:device_id')
  .get(checkPermission('widgets:read'), checkDeviceOwnership('params'), getSensorWidget)
  .put(checkPermission('widgets:write'), checkDeviceOwnership('params'), updateSensorWidget)
  .delete(checkPermission('widgets:delete'), checkDeviceOwnership('params'), deleteSensorWidget);

router.post('/', checkPermission('widgets:write'), validate(createSensorWidgetSchema), createSensorWidget);

module.exports = router;
