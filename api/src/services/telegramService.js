const https = require('https');
const crypto = require('crypto');
const config = require('../config');
const logger = require('../config/logger');
const UserSetting = require('../models/userSettingModel');

/**
 * Pending link codes — maps code → { user_id, chat_id, expires }
 * Code is generated when user calls /start in Telegram,
 * then verified when user submits it in the SmartFarm app.
 *
 * Flow A (bot-initiated): user /start → bot replies with code → user enters code in app
 * Flow B (app-initiated): app generates code → user sends code to bot → bot links
 */
const pendingLinks = new Map();

// Cleanup expired codes every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, data] of pendingLinks) {
    if (now > data.expires) pendingLinks.delete(code);
  }
}, 10 * 60 * 1000);

/**
 * Generate a 6-character alphanumeric link code.
 */
function generateLinkCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

/**
 * Send a message to a Telegram chat via Bot API.
 */
function sendMessage(chatId, text, options = {}) {
  if (!config.telegramBotToken) {
    logger.warn('Telegram bot token not configured');
    return Promise.resolve(null);
  }

  const body = JSON.stringify({
    chat_id: chatId,
    text,
    parse_mode: options.parseMode || 'HTML',
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.telegram.org',
        path: `/bot${config.telegramBotToken}/sendMessage`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        timeout: config.TELEGRAM_API_TIMEOUT_MS,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (!parsed.ok) {
              logger.error('Telegram API error', { description: parsed.description });
            }
            resolve(parsed);
          } catch {
            resolve(null);
          }
        });
      }
    );
    req.on('error', (err) => {
      logger.error('Telegram sendMessage failed', { error: err.message });
      reject(err);
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Telegram API timeout'));
    });
    req.write(body);
    req.end();
  });
}

/**
 * Notify a user via Telegram (called from mqttHandler, etc.).
 * Silently skips if user has no linked Telegram or notification disabled.
 */
async function notifyViaTelegram(userId, message) {
  try {
    const setting = await UserSetting.findOne({ user_id: userId });
    if (!setting?.telegram_chat_id || !setting?.notification?.telegram) return;

    await sendMessage(setting.telegram_chat_id, message);
  } catch (err) {
    logger.error('notifyViaTelegram failed', { user_id: userId, error: err.message });
  }
}

/**
 * Handle incoming Telegram webhook update.
 * Supports: /start, /link <code>, /unlink, /status
 */
async function handleWebhookUpdate(update) {
  const msg = update.message;
  if (!msg?.text || !msg?.chat?.id) return;

  const chatId = String(msg.chat.id);
  const text = msg.text.trim();

  // /start — welcome + instructions
  if (text === '/start') {
    await sendMessage(chatId,
      '<b>SmartFarm Alert Bot</b>\n\n' +
      'เชื่อมต่อบัญชี SmartFarm ของคุณ:\n' +
      '1. ไปที่หน้า Settings ใน SmartFarm app\n' +
      '2. กด "เชื่อมต่อ Telegram"\n' +
      '3. คัดลอกรหัส 6 หลักมาส่งที่นี่\n\n' +
      'หรือพิมพ์ /link รหัส เช่น <code>/link A3F82K</code>'
    );
    return;
  }

  // /link <CODE> — link account using code from app
  if (text.startsWith('/link')) {
    const code = text.split(/\s+/)[1]?.toUpperCase();
    if (!code) {
      await sendMessage(chatId, 'กรุณาระบุรหัส เช่น <code>/link A3F82K</code>');
      return;
    }

    const pending = pendingLinks.get(code);
    if (!pending || Date.now() > pending.expires) {
      await sendMessage(chatId, 'รหัสไม่ถูกต้องหรือหมดอายุ กรุณาสร้างรหัสใหม่ใน SmartFarm app');
      pendingLinks.delete(code);
      return;
    }

    // Link the account
    await UserSetting.findOneAndUpdate(
      { user_id: pending.user_id },
      {
        telegram_chat_id: chatId,
        telegram_linked_at: new Date(),
        'notification.telegram': true,
      },
      { upsert: true }
    );
    pendingLinks.delete(code);

    await sendMessage(chatId, 'เชื่อมต่อสำเร็จ! คุณจะได้รับแจ้งเตือนจาก SmartFarm ที่นี่แล้ว');
    logger.info('Telegram account linked', { user_id: pending.user_id, chat_id: chatId });
    return;
  }

  // /unlink — unlink account
  if (text === '/unlink') {
    const setting = await UserSetting.findOne({ telegram_chat_id: chatId });
    if (!setting) {
      await sendMessage(chatId, 'ไม่พบบัญชีที่เชื่อมต่อ');
      return;
    }
    setting.telegram_chat_id = null;
    setting.telegram_linked_at = null;
    setting.notification.telegram = false;
    await setting.save();
    await sendMessage(chatId, 'ยกเลิกการเชื่อมต่อแล้ว จะไม่ได้รับแจ้งเตือนจาก SmartFarm อีก');
    logger.info('Telegram account unlinked', { user_id: setting.user_id, chat_id: chatId });
    return;
  }

  // /status — check link status
  if (text === '/status') {
    const setting = await UserSetting.findOne({ telegram_chat_id: chatId });
    if (setting) {
      await sendMessage(chatId,
        `เชื่อมต่อกับบัญชี: <b>${setting.user_id}</b>\n` +
        `แจ้งเตือน: ${setting.notification?.telegram ? 'เปิด' : 'ปิด'}`
      );
    } else {
      await sendMessage(chatId, 'ยังไม่ได้เชื่อมต่อบัญชี SmartFarm\nพิมพ์ /start เพื่อดูวิธีเชื่อมต่อ');
    }
    return;
  }

  // Unknown command
  await sendMessage(chatId,
    'คำสั่งที่ใช้ได้:\n' +
    '/start - เริ่มต้นใช้งาน\n' +
    '/link รหัส - เชื่อมต่อบัญชี\n' +
    '/unlink - ยกเลิกการเชื่อมต่อ\n' +
    '/status - ตรวจสอบสถานะ'
  );
}

/**
 * Create a link code for a user (called from settings API).
 * Returns the code for the user to send to the bot.
 */
function createLinkCode(userId) {
  // Remove any existing codes for this user
  for (const [code, data] of pendingLinks) {
    if (data.user_id === userId) pendingLinks.delete(code);
  }

  const code = generateLinkCode();
  pendingLinks.set(code, {
    user_id: userId,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  return code;
}

module.exports = {
  sendMessage,
  notifyViaTelegram,
  handleWebhookUpdate,
  createLinkCode,
};
