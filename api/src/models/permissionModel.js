const mongoose = require('mongoose');

const permissionSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

permissionSchema.index({ user_id: 1 });

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
