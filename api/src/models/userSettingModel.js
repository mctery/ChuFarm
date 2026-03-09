const mongoose = require('mongoose');

const userSettingSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Bangkok',
    },
    language: {
      type: String,
      enum: ['th', 'en'],
      default: 'th',
    },
    notification: {
      email: { type: Boolean, default: false },
      push: { type: Boolean, default: false },
      in_app: { type: Boolean, default: true },
      line: { type: Boolean, default: false },
    },
    line_token: { type: String, default: null },
    quiet_hours: {
      enabled: { type: Boolean, default: false },
      start: { type: String, default: '22:00' },
      end: { type: String, default: '06:00' },
    },
    dashboard: {
      refresh_interval: { type: Number, default: 30 },
    },
  },
  {
    timestamps: true,
  }
);

userSettingSchema.index({ user_id: 1 });

const UserSetting = mongoose.model('UserSetting', userSettingSchema);
module.exports = UserSetting;
