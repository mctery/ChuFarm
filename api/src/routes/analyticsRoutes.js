const express = require('express');
const {
  getSummary,
  getTrend,
  getComparison,
  getRecommendationsEndpoint,
} = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const { checkDeviceOwnership } = require('../middleware/ownershipCheck');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/summary/:device_id',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  getSummary
);

router.get(
  '/trend/:device_id',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  getTrend
);

router.get(
  '/compare',
  checkPermission('sensor_data:read'),
  getComparison
);

router.get(
  '/recommendations/:device_id',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  getRecommendationsEndpoint
);

module.exports = router;
