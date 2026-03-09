const express = require('express');
const {
  getUserSetting,
  updateUserSetting,
} = require('../controllers/userSettingController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission, checkSelfOrAdmin } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { updateUserSettingSchema } = require('../validations/userSettingValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/:user_id', checkPermission('settings:read'), checkSelfOrAdmin(), getUserSetting);
router.put('/:user_id', checkPermission('settings:write'), checkSelfOrAdmin(), validate(updateUserSettingSchema), updateUserSetting);

module.exports = router;
