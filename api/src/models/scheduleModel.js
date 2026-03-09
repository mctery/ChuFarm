const mongoose = require('mongoose');

const actionSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['device_command', 'send_notification', 'log_event'],
      required: true,
    },
    device_id: { type: String },
    command: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    message: { type: String },
  },
  { _id: false }
);

const scheduleSchema = mongoose.Schema(
  {
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    cron_expression: { type: String, required: true },
    timezone: { type: String, default: 'Asia/Bangkok' },
    actions: { type: [actionSchema], required: true },
    is_active: { type: Boolean, default: true },
    next_run: { type: Date, default: null },
    last_run: { type: Date, default: null },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    status: { type: String, default: 'A' },
  },
  { timestamps: true }
);

scheduleSchema.index({ user_id: 1, status: 1 });
scheduleSchema.index({ is_active: 1, status: 1 });

const Schedule = mongoose.model('Schedule', scheduleSchema);
module.exports = Schedule;
