const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    device_id: {
      type: String,
      required: false,
    },
    sensor_id: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
      enum: ['threshold_alert', 'device_offline', 'device_online', 'system'],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ['info', 'warning', 'critical'],
      default: 'info',
    },
    is_read: {
      type: Boolean,
      default: false,
    },
    read_at: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: true,
      default: 'A',
      enum: ['A', 'D'],
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user_id: 1, status: 1, is_read: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
