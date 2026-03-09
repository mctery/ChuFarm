const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authorization');
const { checkPermission, checkSelfOrAdmin } = require('../middleware/checkPermission');

const router = express.Router();

router.use(verifyToken);

router.get('/user/:user_id', checkPermission('notifications:read'), checkSelfOrAdmin(), getNotifications);
router.get('/user/:user_id/unread-count', checkPermission('notifications:read'), checkSelfOrAdmin(), getUnreadCount);
router.put('/:id/read', checkPermission('notifications:write'), markAsRead);
router.put('/user/:user_id/read-all', checkPermission('notifications:write'), checkSelfOrAdmin(), markAllAsRead);
router.delete('/:id', checkPermission('notifications:write'), deleteNotification);

module.exports = router;
