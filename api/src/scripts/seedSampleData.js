const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/userModel');
const Device = require('../models/deviceModel');
const Sensor = require('../models/sensorModel');
const SensorData = require('../models/sensorDataModel');
const SensorWidget = require('../models/sensorWidgetModel');
const Menu = require('../models/menuModel');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/smart_farm';

async function seed() {
  await mongoose.connect(MONGO_URL);

  // Clear previous data
  await Promise.all([
    User.deleteMany({}),
    Device.deleteMany({}),
    Sensor.deleteMany({}),
    SensorData.deleteMany({}),
    SensorWidget.deleteMany({}),
    Menu.deleteMany({}),
  ]);

  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = new User({
      first_name: `User${i}`,
      last_name: 'Test',
      email: `user${i}@example.com`,
      password: await bcrypt.hash('password', 10),
      status: 'A',
    });
    await user.save();
    users.push(user);
  }

  const devices = [];
  for (let i = 1; i <= 10; i++) {
    const device = new Device({
      device_id: `DEV${i}`,
      name: `Device ${i}`,
      status: 'A',
      user_id: users[i - 1]._id.toString(),
      version: '1.0',
    });
    await device.save();
    devices.push(device);
  }

  const sensors = [];
  for (let i = 1; i <= 10; i++) {
    const sensor = new Sensor({
      user_id: i,
      device_id: devices[i - 1].device_id,
      sensor_type: 'temperature',
      sensor_id: `S${i}`,
      unit: 'C',
      status: true,
    });
    await sensor.save();
    sensors.push(sensor);
  }

  for (let i = 1; i <= 10; i++) {
    await SensorData.create({
      device_id: sensors[i - 1].device_id,
      sensor_id: sensors[i - 1].sensor_id,
      sensor: sensors[i - 1].sensor_type,
      value: 20 + i,
      status: true,
    });
  }

  for (let i = 1; i <= 10; i++) {
    await SensorWidget.create({
      device_id: devices[i - 1].device_id,
      widget_json: JSON.stringify({ layout: i }),
      status: 'A',
    });
  }

  for (let i = 1; i <= 10; i++) {
    await Menu.create({
      name: `Menu ${i}`,
      path: `/menu${i}`,
      order: i,
      status: 'A',
    });
  }

  console.log('Seeding completed');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
