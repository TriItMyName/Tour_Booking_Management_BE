const db = require('../config/db');

// Lấy tất cả notifications
exports.getAllNotifications = (callback) => {
    db.query('SELECT * FROM notifications ORDER BY created_at DESC', (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Lấy notification theo ID
exports.getNotificationById = (notificationId, callback) => {
    db.query('SELECT * FROM notifications WHERE notification_id = ?', [notificationId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('Notification not found'), null);
        }
        callback(null, results[0]);
    });
};

// Lấy notifications theo user
exports.getNotificationsByUserId = (userId, callback) => {
    db.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        }
    );
};

// Lấy notifications chưa đọc
exports.getUnreadNotificationsByUserId = (userId, callback) => {
    db.query(
        'SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC',
        [userId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        }
    );
};

// Tạo notification mới
exports.createNotification = (notificationData, callback) => {
    const { user_id, content, is_read } = notificationData;

    if (!user_id || !content) {
        return callback(new Error('user_id and content are required'), null);
    }

    db.query(
        'INSERT INTO notifications (user_id, content, is_read) VALUES (?, ?, ?)',
        [user_id, content, is_read || 0],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { 
                notification_id: results.insertId, 
                user_id, 
                content, 
                is_read: is_read || 0 
            });
        }
    );
};

// Đánh dấu notification đã đọc
exports.markNotificationAsRead = (notificationId, callback) => {
    db.query(
        'UPDATE notifications SET is_read = 1 WHERE notification_id = ?',
        [notificationId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { message: 'Notification marked as read' });
        }
    );
};

// Đánh dấu tất cả notifications của user đã đọc
exports.markAllNotificationsAsRead = (userId, callback) => {
    db.query(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { message: 'All notifications marked as read', affected: results.affectedRows });
        }
    );
};

// Xóa notification
exports.deleteNotification = (notificationId, callback) => {
    db.query('DELETE FROM notifications WHERE notification_id = ?', [notificationId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'Notification deleted successfully' });
    });
};

// Xóa tất cả notifications đã đọc của user
exports.deleteReadNotifications = (userId, callback) => {
    db.query(
        'DELETE FROM notifications WHERE user_id = ? AND is_read = 1',
        [userId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { message: 'Read notifications deleted', affected: results.affectedRows });
        }
    );
};
