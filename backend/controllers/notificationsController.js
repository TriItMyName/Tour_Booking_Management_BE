const Notification = require('../models/notificationsModel');

// Lấy tất cả notifications
exports.getAllNotifications = (req, res) => {
    Notification.getAllNotifications((err, notifications) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving notifications', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: notifications 
        });
    });
};

// Lấy notification theo ID
exports.getNotificationById = (req, res) => {
    const notificationId = req.params.id;
    
    Notification.getNotificationById(notificationId, (err, notification) => {
        if (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notification not found', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: notification 
        });
    });
};

// Lấy notifications theo user
exports.getNotificationsByUserId = (req, res) => {
    const userId = req.params.userId;
    
    Notification.getNotificationsByUserId(userId, (err, notifications) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving notifications', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: notifications 
        });
    });
};

// Lấy notifications chưa đọc
exports.getUnreadNotificationsByUserId = (req, res) => {
    const userId = req.params.userId;
    
    Notification.getUnreadNotificationsByUserId(userId, (err, notifications) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving unread notifications', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: notifications 
        });
    });
};

// Tạo notification mới
exports.createNotification = (req, res) => {
    const { user_id, content, is_read } = req.body;

    if (!user_id || !content) {
        return res.status(400).json({ 
            success: false, 
            message: 'user_id and content are required' 
        });
    }

    const notificationData = {
        user_id,
        content,
        is_read
    };

    Notification.createNotification(notificationData, (err, newNotification) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error creating notification', 
                error: err.message 
            });
        }
        res.status(201).json({ 
            success: true, 
            message: 'Notification created successfully', 
            data: newNotification 
        });
    });
};

// Đánh dấu notification đã đọc
exports.markNotificationAsRead = (req, res) => {
    const notificationId = req.params.id;
    
    Notification.markNotificationAsRead(notificationId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error marking notification as read', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    });
};

// Đánh dấu tất cả notifications đã đọc
exports.markAllNotificationsAsRead = (req, res) => {
    const userId = req.params.userId;
    
    Notification.markAllNotificationsAsRead(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error marking all notifications as read', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message,
            affected: result.affected
        });
    });
};

// Xóa notification
exports.deleteNotification = (req, res) => {
    const notificationId = req.params.id;
    
    Notification.deleteNotification(notificationId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting notification', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    });
};

// Xóa tất cả notifications đã đọc
exports.deleteReadNotifications = (req, res) => {
    const userId = req.params.userId;
    
    Notification.deleteReadNotifications(userId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting read notifications', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message,
            affected: result.affected
        });
    });
};
