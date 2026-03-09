const mongoose = require('mongoose');

const sensorThresholdSchema = mongoose.Schema(
  {
    sensor_id: {
      type: String,
      required: true,
    },
    device_id: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    min_value: {
      type: Number,
      required: false,
      default: null,
    },
    max_value: {
      type: Number,
      required: false,
      default: null,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    notify_type: {
      type: String,
      enum: ['in_app', 'push', 'both'],
      default: 'in_app',
    },
  },
  {
    timestamps: true,
  }
);

sensorThresholdSchema.index({ device_id: 1, sensor_id: 1 });
sensorThresholdSchema.index({ user_id: 1, is_active: 1 });

const SensorThreshold = mongoose.model('SensorThreshold', sensorThresholdSchema);
module.exports = SensorThreshold;
