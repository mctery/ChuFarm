const mongoose = require('mongoose');

const sensorSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: false,
    },
    device_id: {
      type: String,
      required: true,
    },
    sensor_name: {
      type: String,
      required: false,
    },
    sensor_type: {
      type: String,
      required: true,
    },
    sensor_id: {
      type: String,
      required: false,
    },
    unit: {
      type: String,
      required: false,
    },
    max: {
      type: Number,
      required: false,
      default: null,
    },
    min: {
      type: Number,
      required: false,
      default: null,
    },
    ratio: {
      type: String,
      required: false,
      default: null,
    },
    bgcolor: {
      type: String,
      required: false,
      default: '#ecf0f1',
    },
    status: {
      type: String,
      required: false,
      default: 'A',
    },
  },
  {
    timestamps: true,
  }
);

sensorSchema.index({ device_id: 1, sensor_type: 1 });
sensorSchema.index({ user_id: 1, status: 1 });

const Sensor = mongoose.model('Sensor', sensorSchema);

module.exports = Sensor;
