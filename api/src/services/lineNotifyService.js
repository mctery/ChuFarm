const axios = require('axios');
const logger = require('../config/logger');
const UserSetting = require('../models/userSettingModel');
const { LINE_NOTIFY_URL, LINE_NOTIFY_TIMEOUT_MS, DEFAULT_TIMEZONE } = require('../config');

/**
 * Send a LINE Notify message to a user.
 * @param {string} token - LINE Notify access token
 * @param {string} message - Message to send
 * @returns {boolean} - true if sent successfully
 */
async function sendLineNotify(token, message) {
  try {
    await axios.post(
      LINE_NOTIFY_URL,
      new URLSearchParams({ message }),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: LINE_NOTIFY_TIMEOUT_MS,
      }
    );
    logger.debug('LINE Notify sent successfully');
    return true;
  } catch (err) {
    const status = err.response?.status;
    if (status === 401) {
      logger.warn('LINE Notify token invalid/revoked', { status });
    } else {
      logger.error('LINE Notify send failed', { error: err.message, status });
    }
    return false;
  }
}

/**
 * Check if current time is within quiet hours for a user's settings.
 */
function isQuietHours(quietHours, timezone = DEFAULT_TIMEZONE) {
  if (!quietHours || !quietHours.enabled) return false;

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
    const currentTime = formatter.format(now);

    const { start, end } = quietHours;
    if (!start || !end) return false;

    // Handle overnight quiet hours (e.g., 22:00 - 06:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }
    return currentTime >= start && currentTime < end;
  } catch {
    return false;
  }
}

/**
 * Send LINE notification to a user if they have LINE enabled and not in quiet hours.
 * @param {string} userId - User ID
 * @param {string} message - Message to send
 */
async function notifyUserViaLine(userId, message) {
  try {
    const settings = await UserSetting.findOne({ user_id: userId });
    if (!settings) return;
    if (!settings.notification?.line) return;
    if (!settings.line_token) return;

    if (isQuietHours(settings.quiet_hours, settings.timezone)) {
      logger.debug('LINE notify skipped (quiet hours)', { user_id: userId });
      return;
    }

    await sendLineNotify(settings.line_token, message);
  } catch (err) {
    logger.error('notifyUserViaLine error', { user_id: userId, error: err.message });
  }
}

module.exports = { sendLineNotify, isQuietHours, notifyUserViaLine };
