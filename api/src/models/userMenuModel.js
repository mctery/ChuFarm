const mongoose = require('mongoose');

const userMenuSchema = mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
    },
    menu_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Menu',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userMenuSchema.index({ user_id: 1 });

const UserMenu = mongoose.model('UserMenu', userMenuSchema);

module.exports = UserMenu;
