const express = require('express');
const {
  getThresholdsByDevice,
  getThresholdsByUser,
  createThreshold,
  updateThreshold,
  deleteThreshold,
} = require('../controllers/sensorThresholdController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission, checkSelfOrAdmin } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const {
  createThresholdSchema,
  updateThresholdSchema,
} = require('../validations/sensorThresholdValidation');

const router = express.Router();

router.use(verifyToken);

router.post('/', checkPermission('thresholds:write'), validate(createThresholdSchema), createThreshold);
router.get('/device/:device_id', checkPermission('thresholds:read'), getThresholdsByDevice);
router.get('/user/:user_id', checkPermission('thresholds:read'), checkSelfOrAdmin(), getThresholdsByUser);
router
  .route('/:id')
  .put(checkPermission('thresholds:write'), validate(updateThresholdSchema), updateThreshold)
  .delete(checkPermission('thresholds:delete'), deleteThreshold);

module.exports = router;
