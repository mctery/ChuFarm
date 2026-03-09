const mongoose = require('mongoose');

const zoneSchema = mongoose.Schema(
  {
    farm_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Farm', required: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    zone_type: {
      type: String,
      enum: ['greenhouse', 'field', 'nursery', 'storage', 'other'],
      default: 'other',
    },
    area: { type: Number, default: null },
    crop_type: { type: String, default: '' },
    image: { type: String, default: '' },
    status: { type: String, default: 'A' },
  },
  { timestamps: true }
);

zoneSchema.index({ farm_id: 1, status: 1 });

const Zone = mongoose.model('Zone', zoneSchema);
module.exports = Zone;
