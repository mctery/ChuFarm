const mongoose = require('mongoose');

const deviceLogSchema = mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
    },
    event: {
      type: String,
      required: true,
      enum: ['online', 'offline', 'command_sent', 'command_ack'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

deviceLogSchema.index({ device_id: 1, createdAt: -1 });

// TTL: auto-delete after 30 days
deviceLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const DeviceLog = mongoose.model('DeviceLog', deviceLogSchema);
module.exports = DeviceLog;
