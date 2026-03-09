const express = require('express');
const {
  getDevices,
  getDevice,
  getDeviceUser,
  createDevice,
  updateDevice,
  deleteDevice,
  sendDeviceCommand,
} = require('../controllers/deviceController');
const { getDeviceHealth } = require('../controllers/deviceProfileController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission, checkSelfOrAdmin } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { checkDeviceOwnership } = require('../middleware/ownershipCheck');
const {
  createDeviceSchema,
  updateDeviceSchema,
  sendCommandSchema,
} = require('../validations/deviceValidation');

const router = express.Router();

router.use(verifyToken);

router
  .route('/')
  .get(checkPermission('devices:read'), getDevices)
  .post(checkPermission('devices:write'), validate(createDeviceSchema), createDevice);

router.get('/user/:user_id', checkPermission('devices:read'), checkSelfOrAdmin(), getDeviceUser);

router
  .route('/:id')
  .get(checkPermission('devices:read'), getDevice)
  .put(checkPermission('devices:write'), validate(updateDeviceSchema), updateDevice)
  .delete(checkPermission('devices:delete'), deleteDevice);

router.get('/:id/health', checkPermission('devices:read'), getDeviceHealth);

router.post(
  '/:id/commands',
  checkPermission('devices:command'),
  validate(sendCommandSchema),
  checkDeviceOwnership('params'),
  sendDeviceCommand
);

module.exports = router;
