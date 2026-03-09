const mongoose = require('mongoose');

const conditionSchema = mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['sensor_value', 'device_status'],
      required: true,
    },
    device_id: { type: String, required: true },
    sensor_id: { type: String },
    operator: {
      type: String,
      enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'between'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
  },
  { _id: false }
);

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
    delay_seconds: { type: Number, default: 0 },
  },
  { _id: false }
);

const automationRuleSchema = mongoose.Schema(
  {
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
    trigger_type: {
      type: String,
      enum: ['sensor_threshold', 'device_event'],
      required: true,
    },
    conditions: { type: [conditionSchema], required: true },
    actions: { type: [actionSchema], required: true },
    cooldown_seconds: { type: Number, default: 300 },
    last_triggered: { type: Date, default: null },
    priority: { type: Number, default: 0 },
    status: { type: String, default: 'A' },
  },
  { timestamps: true }
);

automationRuleSchema.index({ user_id: 1, status: 1, is_active: 1 });
automationRuleSchema.index({ 'conditions.device_id': 1, is_active: 1, status: 1 });

const AutomationRule = mongoose.model('AutomationRule', automationRuleSchema);
module.exports = AutomationRule;
