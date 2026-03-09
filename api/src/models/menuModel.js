const mongoose = require('mongoose');

const menuSchema = mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    path: { type: String, required: true },
    icon: { type: String, default: null },
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Menu', default: null },
    order: { type: Number, default: 0 },
    status: { type: String, required: true, default: 'A' },
  },
  {
    timestamps: true,
  }
);

menuSchema.index({ status: 1 });
menuSchema.index({ key: 1 }, { unique: true });
menuSchema.index({ parent_id: 1 });

const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;
