const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'login', 'logout'],
    },
    resource_type: {
      type: String,
      required: true,
      enum: ['device', 'sensor', 'user', 'sensor_widget', 'threshold', 'setting'],
    },
    resource_id: {
      type: String,
      required: false,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip_address: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ user_id: 1, createdAt: -1 });
auditLogSchema.index({ resource_type: 1, resource_id: 1 });

// TTL: auto-delete after 365 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
