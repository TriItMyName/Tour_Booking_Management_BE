const db = require('../config/db');

// Lấy tất cả login history
exports.getAllLoginHistory = (callback) => {
    db.query(
        `SELECT lh.*, u.full_name, u.email
         FROM login_history lh
         LEFT JOIN users u ON u.user_id = lh.user_id
         ORDER BY lh.login_time DESC`,
        (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
        }
    );
};

// Lấy login history theo user
exports.getLoginHistoryByUserId = (userId, callback) => {
    db.query(
        `SELECT lh.*, u.full_name, u.email
         FROM login_history lh
         LEFT JOIN users u ON u.user_id = lh.user_id
         WHERE lh.user_id = ?
         ORDER BY lh.login_time DESC`,
        [userId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        }
    );
};

// Lấy login history theo status
exports.getLoginHistoryByStatus = (status, callback) => {
    db.query(
        `SELECT lh.*, u.full_name, u.email
         FROM login_history lh
         LEFT JOIN users u ON u.user_id = lh.user_id
         WHERE lh.login_status = ?
         ORDER BY lh.login_time DESC`,
        [status],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, results);
        }
    );
};

// Tạo login history record
exports.createLoginHistory = (loginData, callback) => {
    const { user_id, ip_address, login_status } = loginData;

    if (!user_id || !login_status) {
        return callback(new Error('user_id and login_status are required'), null);
    }

    db.query(
        'INSERT INTO login_history (user_id, ip_address, login_status) VALUES (?, ?, ?)',
        [user_id, ip_address, login_status],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { 
                log_id: results.insertId, 
                user_id, 
                ip_address, 
                login_status 
            });
        }
    );
};

// Xóa login history cũ (ví dụ: xóa log cũ hơn 90 ngày)
exports.deleteOldLoginHistory = (days, callback) => {
    db.query(
        'DELETE FROM login_history WHERE login_time < DATE_SUB(NOW(), INTERVAL ? DAY)',
        [days],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { message: `Deleted login history older than ${days} days`, affected: results.affectedRows });
        }
    );
};
