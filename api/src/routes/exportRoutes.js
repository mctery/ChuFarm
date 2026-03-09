const express = require('express');
const {
  exportCSV,
  exportJSON,
  getDailySummary,
  getWeeklySummary,
} = require('../controllers/exportController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');
const { checkDeviceOwnership } = require('../middleware/ownershipCheck');

const router = express.Router();

router.use(verifyToken);

router.get(
  '/sensors/:device_id',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  exportCSV
);

router.get(
  '/sensors/:device_id/json',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  exportJSON
);

router.get(
  '/report/daily/:device_id',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  getDailySummary
);

router.get(
  '/report/weekly/:device_id',
  checkPermission('sensor_data:read'),
  checkDeviceOwnership('params'),
  getWeeklySummary
);

module.exports = router;
