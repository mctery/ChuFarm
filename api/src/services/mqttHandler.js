const SensorData = require('../models/sensorDataModel');
const Device = require('../models/deviceModel');
const DeviceLog = require('../models/deviceLogModel');
const SensorThreshold = require('../models/sensorThresholdModel');
const Notification = require('../models/notificationModel');
const logger = require('../config/logger');
const { SENSOR_VALUE_RANGE, NOTIFICATION_COOLDOWN_MS } = require('../config');
const { emitToDevice, emitToUser } = require('../config/socketio');
const { processRules } = require('./ruleEngine');
const { notifyViaTelegram } = require('./telegramService');

/**
 * Notification cooldown — prevents spam when a sensor value stays out of range.
 * Key: "deviceId:sensorId", Value: timestamp of last notification.
 */
const notificationCooldown = new Map();

// Periodic cleanup of stale cooldown entries (every hour)
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000; // 2 hours
  for (const [key, ts] of notificationCooldown) {
    if (now - ts > maxAge) notificationCooldown.delete(key);
  }
}, 60 * 60 * 1000);

/**
 * Handle sensor data messages (device/{id}/temperature, humidity, light, soil)
 * - Save sensor data to DB
 * - Update device online_status + last_seen
 */
async function handleSensorMessage(topic, message) {
  try {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch {
      logger.warn('MQTT invalid JSON payload', { topic });
      return;
    }

    const [, , sensorType] = topic.split('/');

    // Accept both "device_id" and shorthand "d" from ESP32 firmware
    const deviceId = payload.device_id || payload.d;

    // Validate required fields
    if (!deviceId || typeof deviceId !== 'string') {
      logger.warn('MQTT missing or invalid device_id', { topic });
      return;
    }
    if (!payload.v || typeof payload.v !== 'object') {
      logger.warn('MQTT missing or invalid v (values)', { topic, device_id: deviceId });
      return;
    }

    const docs = [];
    for (const [sensorId, value] of Object.entries(payload.v)) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        logger.warn('MQTT non-numeric sensor value', { topic, sensorId, value });
        continue;
      }
      if (numValue < SENSOR_VALUE_RANGE.min || numValue > SENSOR_VALUE_RANGE.max) {
        logger.warn('MQTT sensor value out of range', { topic, sensorId, value: numValue });
        continue;
      }
      docs.push({
        device_id: deviceId,
        sensor_id: sensorId,
        sensor: sensorType,
        value: numValue,
      });
    }

    if (docs.length > 0) {
      await SensorData.insertMany(docs);
    }

    // Update device online status + last_seen
    await Device.findOneAndUpdate(
      { device_id: deviceId },
      { online_status: true, last_seen: new Date() }
    );

    // Emit to Socket.IO clients (same event name as MQTT topic)
    emitToDevice(deviceId, `device/${deviceId}/${sensorType}`, {
      device_id: deviceId,
      v: payload.v,
    });

    // Check thresholds and create notifications
    await checkThresholds(deviceId, docs);

    // Process automation rules
    await processRules(deviceId, docs);
  } catch (err) {
    logger.error('MQTT message handler error', { error: err.message });
  }
}

/**
 * Check sensor values against thresholds and create notifications if exceeded.
 * Uses cooldown to prevent notification spam.
 */
async function checkThresholds(deviceId, sensorDocs) {
  try {
    const thresholds = await SensorThreshold.find({
      device_id: deviceId,
      is_active: true,
    });

    if (thresholds.length === 0) return;

    const device = await Device.findOne({ device_id: deviceId });
    if (!device) return;

    const now = Date.now();
    const thresholdMap = new Map(thresholds.map((t) => [t.sensor_id, t]));

    for (const doc of sensorDocs) {
      const numValue = doc.value;

      const threshold = thresholdMap.get(doc.sensor_id);
      if (!threshold) continue;

      let alertTitle = null;
      let severity = 'warning';

      if (threshold.min_value !== null && numValue < threshold.min_value) {
        alertTitle = `${doc.sensor} ต่ำกว่าเกณฑ์: ${numValue} (min: ${threshold.min_value})`;
      } else if (threshold.max_value !== null && numValue > threshold.max_value) {
        alertTitle = `${doc.sensor} เกินเกณฑ์: ${numValue} (max: ${threshold.max_value})`;
        severity = 'critical';
      }

      if (alertTitle) {
        // Cooldown check — skip if notification was sent recently for this sensor
        const cooldownKey = `${deviceId}:${doc.sensor_id}`;
        const lastNotified = notificationCooldown.get(cooldownKey);
        if (lastNotified && (now - lastNotified) < NOTIFICATION_COOLDOWN_MS) {
          logger.debug('Threshold alert skipped (cooldown)', { device_id: deviceId, sensor_id: doc.sensor_id });
          continue;
        }

        await Notification.create({
          user_id: device.user_id,
          device_id: deviceId,
          sensor_id: doc.sensor_id,
          type: 'threshold_alert',
          title: alertTitle,
          message: `Device: ${device.name} | Sensor: ${doc.sensor_id} | Value: ${numValue}`,
          severity,
        });
        emitToUser(device.user_id, 'new_notification', { count: 1 });
        notificationCooldown.set(cooldownKey, now);
        logger.info('Threshold alert created', { device_id: deviceId, sensor_id: doc.sensor_id, value: numValue });

        // Send Telegram notification (non-blocking)
        notifyViaTelegram(
          device.user_id,
          `\n${alertTitle}\nDevice: ${device.name}\nSensor: ${doc.sensor_id}\nValue: ${numValue}`
        );
      }
    }
  } catch (err) {
    logger.error('Threshold check error', { error: err.message });
  }
}

/**
 * Handle device checkin messages (device/{id}/checkin)
 * - Mark device online + update last_seen
 * - Log online event
 */
async function handleDeviceCheckin(topic, message) {
  try {
    const parts = topic.split('/');
    const deviceId = parts[1];

    let metadata = {};
    try {
      const payload = JSON.parse(message.toString());
      metadata = payload.addr ? { rssi: payload.addr.rssi } : {};
    } catch {
      // payload may not be JSON
    }

    await Device.findOneAndUpdate(
      { device_id: deviceId },
      { online_status: true, last_seen: new Date() }
    );

    await DeviceLog.create({
      device_id: deviceId,
      event: 'online',
      metadata,
    });

    // Emit to Socket.IO clients
    emitToDevice(deviceId, `device/${deviceId}/checkin`, {
      device_id: deviceId,
      addr: metadata.rssi !== undefined ? { rssi: metadata.rssi } : undefined,
    });

    logger.debug('Device checkin', { device_id: deviceId });
  } catch (err) {
    logger.error('Device checkin handler error', { error: err.message });
  }
}

/**
 * Handle device will/disconnect messages (device/{id}/will)
 * - Mark device offline
 * - Log offline event
 */
async function handleDeviceWill(topic, _message) {
  try {
    const parts = topic.split('/');
    const deviceId = parts[1];

    const device = await Device.findOneAndUpdate(
      { device_id: deviceId },
      { online_status: false },
      { new: true }
    );

    await DeviceLog.create({
      device_id: deviceId,
      event: 'offline',
      metadata: {},
    });

    // Emit to Socket.IO clients
    emitToDevice(deviceId, `device/${deviceId}/will`, { device_id: deviceId });

    // Create offline notification
    if (device) {
      await Notification.create({
        user_id: device.user_id,
        device_id: deviceId,
        type: 'device_offline',
        title: `${device.name} ออฟไลน์`,
        message: `อุปกรณ์ ${device.name} (${deviceId}) หยุดเชื่อมต่อ`,
        severity: 'warning',
      });
      emitToUser(device.user_id, 'new_notification', { count: 1 });

      // Send Telegram notification (non-blocking)
      notifyViaTelegram(
        device.user_id,
        `\n${device.name} ออฟไลน์\nอุปกรณ์ ${device.name} (${deviceId}) หยุดเชื่อมต่อ`
      );
    }

    logger.debug('Device will (offline)', { device_id: deviceId });
  } catch (err) {
    logger.error('Device will handler error', { error: err.message });
  }
}

/**
 * Handle device health messages (device/{id}/health)
 * - Update device health fields (battery, rssi, firmware, uptime, ip, mac)
 */
async function handleDeviceHealth(topic, message) {
  try {
    const parts = topic.split('/');
    const deviceId = parts[1];

    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch {
      return;
    }

    const update = { online_status: true, last_seen: new Date() };
    if (payload.battery !== undefined) update.battery_level = Number(payload.battery);
    if (payload.rssi !== undefined) update.signal_strength = Number(payload.rssi);
    if (payload.firmware !== undefined) update.firmware_version = String(payload.firmware);
    if (payload.hardware !== undefined) update.hardware_version = String(payload.hardware);
    if (payload.uptime !== undefined) update.uptime_seconds = Number(payload.uptime);
    if (payload.ip !== undefined) update.ip_address = String(payload.ip);
    if (payload.mac !== undefined) update.mac_address = String(payload.mac);

    await Device.findOneAndUpdate({ device_id: deviceId }, update);

    emitToDevice(deviceId, `device/${deviceId}/health`, { device_id: deviceId, ...payload });

    logger.debug('Device health updated', { device_id: deviceId });
  } catch (err) {
    logger.error('Device health handler error', { error: err.message });
  }
}

module.exports = { handleSensorMessage, handleDeviceCheckin, handleDeviceWill, handleDeviceHealth };
