const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const UserSetting = require('../models/userSettingModel');
const { handleWebhookUpdate, createLinkCode } = require('../services/telegramService');

/**
 * POST /api/telegram/webhook
 * Telegram Bot API webhook endpoint (no auth — called by Telegram servers).
 */
const webhook = asyncHandler(async (req, res) => {
  // Always respond 200 to Telegram (otherwise it retries)
  res.sendStatus(200);
  try {
    await handleWebhookUpdate(req.body);
  } catch (err) {
    logger.error('Telegram webhook error', { error: err.message });
  }
});

/**
 * POST /api/settings/:user_id/telegram/link
 * Generate a link code for the user to send to the bot.
 */
const generateTelegramLink = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const code = createLinkCode(user_id);
  res.json({
    message: 'OK',
    data: {
      code,
      expires_in: 600,
      instructions: 'ส่งรหัสนี้ให้ ChuFarm Bot ใน Telegram โดยพิมพ์ /link ' + code,
    },
  });
});

/**
 * DELETE /api/settings/:user_id/telegram/link
 * Unlink Telegram from user account.
 */
const unlinkTelegram = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  await UserSetting.findOneAndUpdate(
    { user_id },
    {
      telegram_chat_id: null,
      telegram_linked_at: null,
      'notification.telegram': false,
    }
  );
  res.json({ message: 'OK', data: 'Telegram unlinked' });
});

/**
 * GET /api/settings/:user_id/telegram/status
 * Check Telegram link status.
 */
const getTelegramStatus = asyncHandler(async (req, res) => {
  const { user_id } = req.params;
  const setting = await UserSetting.findOne({ user_id });
  res.json({
    message: 'OK',
    data: {
      linked: !!setting?.telegram_chat_id,
      linked_at: setting?.telegram_linked_at || null,
      notification_enabled: setting?.notification?.telegram || false,
    },
  });
});

module.exports = { webhook, generateTelegramLink, unlinkTelegram, getTelegramStatus };
