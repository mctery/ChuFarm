/**
 * One-time migration script: assigns role=admin and creates Permission
 * documents for all existing users.
 *
 * Usage: node src/scripts/migrateRoles.js
 *
 * Safe to run multiple times — skips users who already have a role and
 * Permission docs that already exist.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUrl } = require('../config');
const User = require('../models/userModel');
const Permission = require('../models/permissionModel');

async function migrate() {
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');

  // 1. Set role=admin for all existing users that have no role yet
  const usersWithoutRole = await User.find({ role: { $exists: false } });
  const usersDefaultRole = await User.find({ role: 'user' });
  const toUpdate = [...usersWithoutRole, ...usersDefaultRole];

  let roleUpdated = 0;
  for (const user of toUpdate) {
    user.role = 'admin';
    await user.save();
    roleUpdated++;
  }
  console.log(`Updated ${roleUpdated} users to role=admin`);

  // 2. Create Permission docs with wildcard for all users that don't have one
  const allUsers = await User.find({ status: 'A' });
  let permCreated = 0;
  for (const user of allUsers) {
    const userId = String(user.user_id || user._id);
    const existing = await Permission.findOne({ user_id: userId });
    if (!existing) {
      await Permission.create({ user_id: userId, permissions: ['*'] });
      permCreated++;
    }
  }
  console.log(`Created ${permCreated} Permission documents`);

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
