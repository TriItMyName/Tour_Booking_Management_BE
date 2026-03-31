const express = require('express');
const notificationsController = require('../controllers/notificationsController');

const router = express.Router();

// Lấy tất cả notifications
router.get('/notifications', notificationsController.getAllNotifications);

// Lấy notification theo ID
router.get('/notifications/:id', notificationsController.getNotificationById);

// Lấy notifications theo user
router.get('/notifications/user/:userId', notificationsController.getNotificationsByUserId);

// Lấy notifications chưa đọc theo user
router.get('/notifications/user/:userId/unread', notificationsController.getUnreadNotificationsByUserId);

// Tạo notification mới
router.post('/notifications', notificationsController.createNotification);

// Đánh dấu notification đã đọc
router.patch('/notifications/:id/read', notificationsController.markNotificationAsRead);

// Đánh dấu tất cả notifications đã đọc
router.patch('/notifications/user/:userId/read-all', notificationsController.markAllNotificationsAsRead);

// Xóa notification
router.delete('/notifications/:id', notificationsController.deleteNotification);

// Xóa tất cả notifications đã đọc
router.delete('/notifications/user/:userId/read', notificationsController.deleteReadNotifications);

module.exports = router;
