const mongoose = require('mongoose');

const actionResultSchema = mongoose.Schema(
  {
    type: { type: String, required: true },
    device_id: { type: String },
    command: { type: String },
    status: { type: String, enum: ['success', 'failed'], required: true },
    error: { type: String },
  },
  { _id: false }
);

const ruleExecutionLogSchema = mongoose.Schema(
  {
    rule_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    rule_name: { type: String },
    trigger_type: {
      type: String,
      enum: ['rule', 'schedule'],
      required: true,
    },
    trigger_data: { type: mongoose.Schema.Types.Mixed, default: {} },
    actions_executed: { type: [actionResultSchema], default: [] },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      required: true,
    },
    error_message: { type: String, default: null },
    duration_ms: { type: Number, default: 0 },
    user_id: { type: String, required: true },
  },
  { timestamps: true }
);

// Auto-delete after 30 days
ruleExecutionLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
ruleExecutionLogSchema.index({ rule_id: 1, createdAt: -1 });
ruleExecutionLogSchema.index({ user_id: 1, createdAt: -1 });

const RuleExecutionLog = mongoose.model('RuleExecutionLog', ruleExecutionLogSchema);
module.exports = RuleExecutionLog;
