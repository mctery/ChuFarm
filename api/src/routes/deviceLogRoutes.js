const express = require('express');
const {
  getDeviceLogs,
  getDeviceOnlineHistory,
} = require('../controllers/deviceLogController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(verifyToken);

router.get('/:device_id', checkPermission('device_logs:read'), getDeviceLogs);
router.get('/:device_id/online-history', checkPermission('device_logs:read'), getDeviceOnlineHistory);

module.exports = router;
