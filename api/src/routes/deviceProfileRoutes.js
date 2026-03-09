const express = require('express');
const {
  getProfiles,
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
  getDeviceHealth,
} = require('../controllers/deviceProfileController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission } = require('../middleware/checkPermission');

const router = express.Router();

router.use(verifyToken);

// Device profiles
router.get('/', checkPermission('devices:read'), getProfiles);
router.post('/', checkPermission('devices:write'), createProfile);
router.get('/:id', checkPermission('devices:read'), getProfile);
router.put('/:id', checkPermission('devices:write'), updateProfile);
router.delete('/:id', checkPermission('devices:delete'), deleteProfile);

module.exports = router;
