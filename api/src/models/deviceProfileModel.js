const mongoose = require('mongoose');

const deviceProfileSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    expected_sensors: [{ type: String }],
    default_thresholds: [
      {
        sensor_type: { type: String },
        min_value: { type: Number, default: null },
        max_value: { type: Number, default: null },
      },
    ],
    checkin_interval: { type: Number, default: 60 },
    status: { type: String, default: 'A' },
  },
  { timestamps: true }
);

deviceProfileSchema.index({ status: 1 });

const DeviceProfile = mongoose.model('DeviceProfile', deviceProfileSchema);
module.exports = DeviceProfile;
