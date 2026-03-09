const Menu = require('../models/menuModel');
const UserMenu = require('../models/userMenuModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { STATUS } = require('../config');

/**
 * Build hierarchical menu structure from a flat array of menu documents.
 * Returns top-level menus with their children nested inside.
 */
function buildMenuHierarchy(menus) {
  const menuMap = new Map();
  const topLevel = [];

  for (const menu of menus) {
    menuMap.set(menu._id.toString(), { ...menu.toObject(), children: [] });
  }

  for (const [, menuObj] of menuMap) {
    if (menuObj.parent_id) {
      const parent = menuMap.get(menuObj.parent_id.toString());
      if (parent) {
        parent.children.push(menuObj);
      }
    } else {
      topLevel.push(menuObj);
    }
  }

  topLevel.sort((a, b) => a.order - b.order);
  for (const menu of topLevel) {
    menu.children.sort((a, b) => a.order - b.order);
  }

  return topLevel;
}

const getMenus = asyncHandler(async (req, res) => {
  logger.debug('getMenus called');
  const menus = await Menu.find({ status: STATUS.ACTIVE });
  res.json({ message: 'OK', data: menus });
});

const getMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  if (!menu) {
    res.status(404);
    throw new Error(`Menu not found: ${req.params.id}`);
  }
  res.json({ message: 'OK', data: menu });
});

const createMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.create(req.body);
  res.status(201).json({ message: 'OK', data: menu });
});

const updateMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await Menu.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!updated) {
    res.status(404);
    throw new Error(`Menu not found: ${id}`);
  }
  res.json({ message: 'OK', data: updated });
});

const deleteMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const menu = await Menu.findByIdAndUpdate(id, { status: STATUS.DELETED });
  if (!menu) {
    res.status(404);
    throw new Error(`Menu not found: ${id}`);
  }
  res.json({ message: 'OK', data: menu });
});

const getAccessibleMenus = asyncHandler(async (req, res) => {
  logger.debug('getAccessibleMenus called');
  const decoded = req.User_name;
  const role = decoded.role;
  const userId = decoded.userId;

  let menus;

  if (role === 'admin') {
    menus = await Menu.find({ status: STATUS.ACTIVE });
  } else {
    const userMenu = await UserMenu.findOne({ user_id: userId });
    if (!userMenu || userMenu.menu_ids.length === 0) {
      return res.json({ message: 'OK', data: [] });
    }
    menus = await Menu.find({ _id: { $in: userMenu.menu_ids }, status: STATUS.ACTIVE });
  }

  const hierarchy = buildMenuHierarchy(menus);
  res.json({ message: 'OK', data: hierarchy });
});

module.exports = { getMenus, getMenu, createMenu, updateMenu, deleteMenu, getAccessibleMenus, buildMenuHierarchy };
