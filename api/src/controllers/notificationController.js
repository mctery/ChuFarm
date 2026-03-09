const Notification = require('../models/notificationModel');
const asyncHandler = require('express-async-handler');
const logger = require('../config/logger');
const { QUERY_LIMITS, STATUS } = require('../config');
const { paginateQuery } = require('../utils/pagination');

const getNotifications = asyncHandler(async (req, res) => {
  logger.debug('getNotifications called');
  const { user_id } = req.params;
  const filter = { user_id, status: { $ne: STATUS.DELETED } };
  if (req.query?.is_read !== undefined) {
    filter.is_read = req.query.is_read === 'true';
  }

  const result = await paginateQuery(Notification, filter, req.query, {
    defaultLimit: QUERY_LIMITS.default,
  });
  res.json({ message: 'OK', data: result.data, ...(result.pagination && { pagination: result.pagination }) });
});

const getUnreadCount = asyncHandler(async (req, res) => {
  logger.debug('getUnreadCount called');
  const { user_id } = req.params;
  const count = await Notification.countDocuments({ user_id, is_read: false, status: { $ne: STATUS.DELETED } });
  res.json({ message: 'OK', data: { count } });
});

const markAsRead = asyncHandler(async (req, res) => {
  logger.debug('markAsRead called');
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, status: { $ne: STATUS.DELETED } },
    { is_read: true, read_at: new Date() },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ message: 'OK', data: notification });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  logger.debug('markAllAsRead called');
  const { user_id } = req.params;
  await Notification.updateMany(
    { user_id, is_read: false, status: { $ne: STATUS.DELETED } },
    { is_read: true, read_at: new Date() }
  );
  res.json({ message: 'OK', data: 'All notifications marked as read' });
});

const deleteNotification = asyncHandler(async (req, res) => {
  logger.debug('deleteNotification called');
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, status: { $ne: STATUS.DELETED } },
    { status: STATUS.DELETED },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json({ message: 'OK', data: notification });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
