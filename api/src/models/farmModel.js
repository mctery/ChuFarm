const mongoose = require('mongoose');

const farmSchema = mongoose.Schema(
  {
    user_id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    location: {
      address: { type: String, default: '' },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    image: { type: String, default: '' },
    farm_type: {
      type: String,
      enum: ['greenhouse', 'openfield', 'indoor', 'hydroponic', 'other'],
      default: 'other',
    },
    total_area: { type: Number, default: null },
    status: { type: String, default: 'A' },
  },
  { timestamps: true }
);

farmSchema.index({ user_id: 1, status: 1 });

const Farm = mongoose.model('Farm', farmSchema);
module.exports = Farm;
