require('dotenv').config();

/** Record status constants — single source of truth for soft-delete pattern */
const STATUS = { ACTIVE: 'A', DELETED: 'D' };

/** Sensor value range for MQTT validation (light sensors can reach 100,000+ lux) */
const SENSOR_VALUE_RANGE = { min: -1000, max: 150000 };

/** Default query limits per resource */
const QUERY_LIMITS = {
  default: 20,
  auditLogs: 50,
  deviceLogs: 50,
  onlineHistory: 100,
  adminUsersMax: 100,
  adminDevicesMax: 100,
  adminSensorsMax: 100,
  adminNotificationsMax: 100,
  adminDeviceLogsMax: 100,
};

/** Weather cache cleanup interval (ms) */
const WEATHER_CACHE_CLEANUP_MS = 10 * 60 * 1000; // 10 minutes

/** Notification cooldown to prevent spam (ms) */
const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

/** Default timezone for schedules and quiet hours */
const DEFAULT_TIMEZONE = 'Asia/Bangkok';

/** Analytics trend threshold (%) — above this = rising, below negative = falling */
const TREND_THRESHOLD_PERCENT = 5;

/** Export limits */
const EXPORT = {
  maxDays: 31,
  maxRows: 100000,
};

/** Centralized enums — single source of truth for model enums */
const ENUMS = {
  ROLES: ['admin', 'user'],
  FARM_TYPES: ['greenhouse', 'openfield', 'indoor', 'hydroponic', 'other'],
  ZONE_TYPES: ['greenhouse', 'field', 'nursery', 'storage', 'other'],
  NOTIFICATION_TYPES: ['threshold_alert', 'device_offline', 'device_online', 'system'],
  SEVERITY: ['info', 'warning', 'critical'],
  AUDIT_ACTIONS: ['create', 'update', 'delete', 'login', 'logout'],
  AUDIT_RESOURCES: ['device', 'sensor', 'user', 'sensor_widget', 'threshold', 'setting'],
  DEVICE_LOG_EVENTS: ['online', 'offline', 'command_sent', 'command_ack'],
  CONDITION_TYPES: ['sensor_value', 'device_status'],
  OPERATORS: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between'],
  LOGIC: ['AND', 'OR'],
  ACTION_TYPES: ['device_command', 'send_notification', 'log_event'],
  TRIGGER_TYPES: ['sensor_threshold', 'device_event'],
  EXEC_TRIGGER_TYPES: ['rule', 'schedule'],
  EXEC_STATUSES: ['success', 'partial', 'failed'],
  NOTIFY_METHODS: ['in_app', 'push', 'both'],
  LANGUAGES: ['th', 'en'],
};

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.TOKEN_KEY,
  jwtExpiry: process.env.JWT_EXPIRY || '12h',
  refreshSecret: process.env.REFRESH_TOKEN_KEY || (process.env.TOKEN_KEY + '_refresh'),
  refreshExpiry: process.env.REFRESH_EXPIRY || '7d',
  bcryptRounds: 10,
  mqttUrl: process.env.MQTT_URL,
  mqttUser: process.env.MQTT_USER || '',
  mqttPass: process.env.MQTT_PASS || '',
  // MQTT topics to subscribe — explicit list (wildcard unsafe on public brokers)
  mqttTopics: [
    'device/+/temperature',
    'device/+/humidity',
    'device/+/light',
    'device/+/soil',
    'device/+/checkin',
    'device/+/will',
    'device/+/health',
  ],
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM || 'SmartFarm <onboarding@resend.dev>',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  resetTokenExpiryMs: 60 * 60 * 1000, // 1 hour
  corsOrigin: process.env.FRONTEND,
  bodyLimit: '10mb',
  sensorDataTTL: 90 * 24 * 60 * 60, // 90 days in seconds
  weatherCacheTTL: 3600, // 1 hour in seconds
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100,
  authRateLimitMax: 10,
  STATUS,
  SENSOR_VALUE_RANGE,
  QUERY_LIMITS,
  WEATHER_CACHE_CLEANUP_MS,
  NOTIFICATION_COOLDOWN_MS,
  DEFAULT_TIMEZONE,
  TREND_THRESHOLD_PERCENT,
  EXPORT,
  ENUMS,
};

// Startup warnings for missing config
if (!process.env.RESEND_API_KEY) {
  console.warn(
    '[WARN] RESEND_API_KEY is not set — password reset emails will not be sent. ' +
    'Set RESEND_API_KEY in .env for production.'
  );
}

if (!process.env.REFRESH_TOKEN_KEY) {
  console.warn(
    '[WARN] REFRESH_TOKEN_KEY is not set — using TOKEN_KEY + "_refresh" as fallback. ' +
    'Set a dedicated REFRESH_TOKEN_KEY in .env for production.'
  );
}
