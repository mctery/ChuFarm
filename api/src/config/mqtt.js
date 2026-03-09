const mqtt = require('mqtt');
const config = require('./index');
const logger = require('./logger');

function createMqttClient() {
  const client = mqtt.connect(config.mqttUrl, {
    username: config.mqttUser,
    password: config.mqttPass,
    clientId: 'mqttjs_' + Math.random().toString(16).substring(2, 10),
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    will: {
      topic: 'device/will',
      payload: 'device disconnected',
      qos: 0,
      retain: false,
    },
  });

  client.on('reconnect', () => {
    logger.warn('MQTT reconnecting...');
  });

  client.on('offline', () => {
    logger.warn('MQTT client offline');
  });

  client.on('error', (err) => {
    logger.error('MQTT client error', { error: err.message });
  });

  return client;
}

function subscribeSensorTopics(client) {
  for (const topic of config.mqttTopics) {
    client.subscribe(topic, (err) => {
      if (err) logger.error('MQTT subscribe error', { error: err.message });
    });
  }
}

module.exports = { createMqttClient, subscribeSensorTopics };
