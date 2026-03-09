const mongoose = require("mongoose");

const deviceSchema = mongoose.Schema(
  {
    device_id: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: false,
      default: '1.0',
    },
    image: {
      type: String,
      required: false,
      default: '',
    },
    online_status: {
      type: Boolean,
      required: false,
      default: false,
    },
    last_seen: {
      type: Date,
      required: false,
      default: null,
    },
    user_id: {
      type: String,
      required: true,
    },
    farm_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farm',
      default: null,
    },
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    // Phase 5: Device Health fields
    firmware_version: { type: String, default: null },
    hardware_version: { type: String, default: null },
    battery_level: { type: Number, default: null },
    signal_strength: { type: Number, default: null },
    ip_address: { type: String, default: null },
    mac_address: { type: String, default: null },
    uptime_seconds: { type: Number, default: null },
    profile_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DeviceProfile',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ device_id: 1 }, { unique: true });
deviceSchema.index({ user_id: 1, status: 1 });
deviceSchema.index({ farm_id: 1, status: 1 });
deviceSchema.index({ zone_id: 1, status: 1 });

const Device = mongoose.model("Device", deviceSchema);
module.exports = Device;

// {
//   "user_id": 123,
//   "device_id": "44c44e9ef0c7",
//   "name": "My Device",
//   "version": "1.0",
//   "status": true,
//   "online_status": true,
//   "image": "device-image.jpg"
// }
