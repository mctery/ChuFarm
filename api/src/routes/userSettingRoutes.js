const express = require('express');
const {
  getUserSetting,
  updateUserSetting,
  connectLine,
  disconnectLine,
  testLine,
} = require('../controllers/userSettingController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission, checkSelfOrAdmin } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { updateUserSettingSchema } = require('../validations/userSettingValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/:user_id', checkPermission('settings:read'), checkSelfOrAdmin(), getUserSetting);
router.put('/:user_id', checkPermission('settings:write'), checkSelfOrAdmin(), validate(updateUserSettingSchema), updateUserSetting);

// LINE Notify endpoints
router.post('/:user_id/line/connect', checkPermission('settings:write'), checkSelfOrAdmin(), connectLine);
router.delete('/:user_id/line/disconnect', checkPermission('settings:write'), checkSelfOrAdmin(), disconnectLine);
router.post('/:user_id/line/test', checkPermission('settings:write'), checkSelfOrAdmin(), testLine);

module.exports = router;
