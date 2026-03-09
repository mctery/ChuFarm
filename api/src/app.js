const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { validateEnv } = require('./config/startup');
const config = require('./config');
const logger = require('./config/logger');

// Fail fast if required env vars are missing
validateEnv();
const requestLogger = require('./middleware/requestLogger');
const errorMiddleware = require('./middleware/errorMiddleware');

// Routes
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const sensorWidgetRoutes = require('./routes/sensorWidgetRoutes');
const sensorDataRoutes = require('./routes/sensorDataRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const menuRoutes = require('./routes/menuRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const sensorThresholdRoutes = require('./routes/sensorThresholdRoutes');
const deviceLogRoutes = require('./routes/deviceLogRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const userSettingRoutes = require('./routes/userSettingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const automationRuleRoutes = require('./routes/automationRuleRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const farmRoutes = require('./routes/farmRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const exportRoutes = require('./routes/exportRoutes');
const deviceProfileRoutes = require('./routes/deviceProfileRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();

// Trust proxy (required for Vercel / reverse proxies — express-rate-limit needs correct client IP)
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// Middleware
app.use(cors({ origin: config.corsOrigin, optionsSuccessStatus: 200 }));

// Global rate limit
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'ERROR', data: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ limit: config.bodyLimit, extended: true }));
app.use(requestLogger);

// Vercel serverless: lazy DB connection on first request
if (process.env.VERCEL) {
  let dbReady = false;
  app.use(async (_req, _res, next) => {
    if (!dbReady) {
      await connectDatabase();
      dbReady = true;
    }
    next();
  });
}

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/sensorWidget', sensorWidgetRoutes);
app.use('/api/sensorsdata', sensorDataRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/thresholds', sensorThresholdRoutes);
app.use('/api/device-logs', deviceLogRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/settings', userSettingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rules', automationRuleRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/device-profiles', deviceProfileRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorMiddleware);

// Database
mongoose.set('strictQuery', false);

async function connectDatabase() {
  logger.info('Connecting to MongoDB...');
  await mongoose.connect(config.mongoUrl);
  logger.info('Connected to MongoDB');
}

// MQTT (lazy-loaded — only in local/production, not Vercel serverless)
function setupMqtt() {
  const { createMqttClient, subscribeSensorTopics } = require('./config/mqtt');
  const { handleSensorMessage, handleDeviceCheckin, handleDeviceWill, handleDeviceHealth } = require('./services/mqttHandler');
  const { setCommandClient } = require('./controllers/deviceController');
  const { setMqttClient: setActionExecutorMqtt } = require('./services/actionExecutor');

  logger.info('Setting up MQTT...');
  const mqttClient = createMqttClient();
  setCommandClient(mqttClient);
  setActionExecutorMqtt(mqttClient);

  mqttClient.on('connect', () => {
    logger.info('MQTT client connected');
    subscribeSensorTopics(mqttClient);
  });

  const reservedHandlers = { checkin: handleDeviceCheckin, will: handleDeviceWill, health: handleDeviceHealth };

  mqttClient.on('message', (topic, message) => {
    const subtopic = topic.split('/')[2]; // device/{id}/{subtopic}
    const handler = reservedHandlers[subtopic];
    if (handler) {
      handler(topic, message);
    } else {
      handleSensorMessage(topic, message);
    }
  });

  mqttClient.on('error', (err) => {
    logger.error('MQTT error in app', { error: err.message });
  });

  return mqttClient;
}

// Startup (local/production only — NOT used on Vercel serverless)
let server;

async function start() {
  const { initSocketIO } = require('./config/socketio');

  try {
    await connectDatabase();
    server = http.createServer(app);
    initSocketIO(server);
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} (HTTP + Socket.IO)`);
    });
    setupMqtt();

    // Initialize scheduled automation tasks
    const { initSchedules } = require('./services/scheduleEngine');
    await initSchedules();
  } catch (err) {
    logger.error('Failed to start server', { error: err.message });
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down...');
  try {
    const { stopAllSchedules } = require('./services/scheduleEngine');
    stopAllSchedules();
  } catch { /* schedule engine may not be loaded */ }
  if (server) server.close();
  await mongoose.disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Only auto-start when run directly (not when imported by Vercel serverless)
if (require.main === module) {
  start();
}

module.exports = { app, start, connectDatabase };
