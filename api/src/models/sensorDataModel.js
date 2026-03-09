const mongoose = require('mongoose');

const sensorDataSchema = mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
    },
    sensor_id: {
      type: String,
      required: true,
    },
    sensor: {
      type: String,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for query performance
sensorDataSchema.index({ device_id: 1, sensor: 1, createdAt: -1 });

// TTL index: auto-delete after 90 days
sensorDataSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

const SensorData = mongoose.model('SensorData', sensorDataSchema);

module.exports = SensorData;
