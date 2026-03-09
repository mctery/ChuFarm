/**
 * Migration script: seeds Menu data and creates UserMenu documents
 * for all existing users.
 *
 * Usage: node src/scripts/migrateMenus.js
 *
 * Safe to run multiple times — skips menus that already exist (by key)
 * and UserMenu docs that already exist.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { mongoUrl } = require('../config');
const User = require('../models/userModel');
const Menu = require('../models/menuModel');
const UserMenu = require('../models/userMenuModel');

const MENU_SEED = [
  { key: 'dashboard', name: 'Dashboard', path: '/dashboard', icon: 'Home', order: 1, parent_key: null },
  { key: 'devices', name: 'Devices', path: '/farm_control_system/devices', icon: 'Devices', order: 2, parent_key: null },
  { key: 'about', name: 'About', path: '/about', icon: 'Info', order: 3, parent_key: null },
  { key: 'help', name: 'Help', path: '/help', icon: 'Help', order: 4, parent_key: null },
  { key: 'admin', name: 'Admin', path: '/admin', icon: 'AdminPanelSettings', order: 100, parent_key: null },
  { key: 'admin_dashboard', name: 'ภาพรวม', path: '/admin/dashboard', icon: 'BarChart', order: 1, parent_key: 'admin' },
  { key: 'admin_users', name: 'จัดการผู้ใช้', path: '/admin/users', icon: 'People', order: 2, parent_key: 'admin' },
  { key: 'admin_devices', name: 'จัดการอุปกรณ์', path: '/admin/devices', icon: 'Devices', order: 3, parent_key: 'admin' },
  { key: 'admin_sensors', name: 'จัดการเซ็นเซอร์', path: '/admin/sensors', icon: 'Sensors', order: 4, parent_key: 'admin' },
  { key: 'admin_audit_logs', name: 'ล็อกการตรวจสอบ', path: '/admin/audit-logs', icon: 'Assignment', order: 5, parent_key: 'admin' },
  { key: 'admin_device_logs', name: 'ล็อกอุปกรณ์', path: '/admin/device-logs', icon: 'ListAlt', order: 6, parent_key: 'admin' },
  { key: 'admin_notifications', name: 'การแจ้งเตือน', path: '/admin/notifications', icon: 'Notifications', order: 7, parent_key: 'admin' },
  { key: 'admin_menus', name: 'จัดการเมนู', path: '/admin/menus', icon: 'MenuBook', order: 8, parent_key: 'admin' },
  { key: 'admin_settings', name: 'ตั้งค่าระบบ', path: '/admin/settings', icon: 'Settings', order: 9, parent_key: 'admin' },
];

const ADMIN_ONLY_KEYS = [
  'admin', 'admin_dashboard', 'admin_users', 'admin_devices', 'admin_sensors',
  'admin_audit_logs', 'admin_device_logs', 'admin_notifications', 'admin_menus', 'admin_settings',
];

async function migrate() {
  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB');

  // 1. Seed Menu documents
  const menuMap = new Map();
  let menusCreated = 0;

  // First pass: create/find all menus
  for (const seed of MENU_SEED) {
    let menu = await Menu.findOne({ key: seed.key });
    if (!menu) {
      menu = await Menu.create({
        key: seed.key,
        name: seed.name,
        path: seed.path,
        icon: seed.icon,
        order: seed.order,
        parent_id: null,
        status: 'A',
      });
      menusCreated++;
      console.log(`  Created menu: ${seed.key}`);
    } else {
      // Update existing menu if name/icon/order changed
      let updated = false;
      if (menu.name !== seed.name) { menu.name = seed.name; updated = true; }
      if (menu.icon !== seed.icon) { menu.icon = seed.icon; updated = true; }
      if (menu.order !== seed.order) { menu.order = seed.order; updated = true; }
      if (menu.path !== seed.path) { menu.path = seed.path; updated = true; }
      if (updated) {
        await menu.save();
        console.log(`  Updated menu: ${seed.key}`);
      } else {
        console.log(`  Skipped (up-to-date): ${seed.key}`);
      }
    }
    menuMap.set(seed.key, menu);
  }

  // Second pass: set parent_id for children
  for (const seed of MENU_SEED) {
    if (seed.parent_key) {
      const parent = menuMap.get(seed.parent_key);
      const child = menuMap.get(seed.key);
      if (parent && child && !child.parent_id) {
        child.parent_id = parent._id;
        await child.save();
        console.log(`  Linked ${seed.key} -> parent ${seed.parent_key}`);
      }
    }
  }
  console.log(`Created ${menusCreated} new Menu documents`);

  // 2. Determine menu IDs
  const allMenuIds = Array.from(menuMap.values()).map(m => m._id);
  const regularMenuIds = Array.from(menuMap.entries())
    .filter(([key]) => !ADMIN_ONLY_KEYS.includes(key))
    .map(([, menu]) => menu._id);

  // 3. Create or update UserMenu documents for all existing active users
  const allUsers = await User.find({ status: 'A' });
  let userMenusCreated = 0;
  let userMenusUpdated = 0;

  for (const user of allUsers) {
    const userId = String(user.user_id || user._id);
    const targetMenuIds = user.role === 'admin' ? allMenuIds : regularMenuIds;
    const existing = await UserMenu.findOne({ user_id: userId });

    if (!existing) {
      await UserMenu.create({ user_id: userId, menu_ids: targetMenuIds });
      userMenusCreated++;
      console.log(`  Created UserMenu for user: ${userId} (${user.role}) with ${targetMenuIds.length} menus`);
    } else {
      // Add any new menus that are missing from existing UserMenu
      const existingIds = existing.menu_ids.map(id => id.toString());
      const newIds = targetMenuIds.filter(id => !existingIds.includes(id.toString()));
      if (newIds.length > 0) {
        existing.menu_ids = [...existing.menu_ids, ...newIds];
        await existing.save();
        userMenusUpdated++;
        console.log(`  Updated UserMenu for user: ${userId} — added ${newIds.length} new menus`);
      } else {
        console.log(`  Skipped UserMenu (up-to-date): ${userId}`);
      }
    }
  }
  console.log(`Created ${userMenusCreated}, updated ${userMenusUpdated} UserMenu documents`);

  await mongoose.disconnect();
  console.log('Migration complete');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
