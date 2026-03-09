const express = require('express');
const {
  getUserSetting,
  updateUserSetting,
} = require('../controllers/userSettingController');
const {
  generateTelegramLink,
  unlinkTelegram,
  getTelegramStatus,
} = require('../controllers/telegramController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission, checkSelfOrAdmin } = require('../middleware/checkPermission');
const validate = require('../middleware/validate');
const { updateUserSettingSchema } = require('../validations/userSettingValidation');

const router = express.Router();

router.use(verifyToken);

router.get('/:user_id', checkPermission('settings:read'), checkSelfOrAdmin(), getUserSetting);
router.put('/:user_id', checkPermission('settings:write'), checkSelfOrAdmin(), validate(updateUserSettingSchema), updateUserSetting);

// Telegram link/unlink/status
router.post('/:user_id/telegram/link', checkPermission('settings:write'), checkSelfOrAdmin(), generateTelegramLink);
router.delete('/:user_id/telegram/link', checkPermission('settings:write'), checkSelfOrAdmin(), unlinkTelegram);
router.get('/:user_id/telegram/status', checkPermission('settings:read'), checkSelfOrAdmin(), getTelegramStatus);

module.exports = router;
