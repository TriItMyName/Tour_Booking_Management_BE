const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Lấy tất cả người dùng
exports.getAllUsers = (callback) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Lấy thông tin người dùng theo ID
exports.getUserById = (userId, callback) => {
    db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('User not found'), null);
        }
        callback(null, results[0]);
    });
};

// Lấy người dùng theo email
exports.getUserByEmail = (email, callback) => {
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('User not found'), null);
        }
        callback(null, results[0]);
    });
};

// Lấy người dùng theo role
exports.getUsersByRole = (roleId, callback) => {
    db.query('SELECT * FROM users WHERE role_id = ?', [roleId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Tạo một người dùng mới
exports.createUser = (userData, callback) => {
    const { role_id, full_name, email, phone, password, is_active } = userData;

    // Kiểm tra nếu password không tồn tại
    if (!password) {
        return callback(new Error('Password is required'), null);
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 8); // Mã hóa mật khẩu
        db.query(
            'INSERT INTO users (role_id, full_name, email, phone, password, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [role_id, full_name, email, phone, hashedPassword, is_active !== undefined ? is_active : 1],
            (err, results) => {
                if (err) {
                    return callback(err, null);
                }
                callback(null, { 
                    user_id: results.insertId, 
                    role_id, 
                    full_name, 
                    email, 
                    phone, 
                    is_active: is_active !== undefined ? is_active : 1 
                });
            }
        );
    } catch (error) {
        callback(error, null);
    }
};

// Cập nhật thông tin người dùng
exports.updateUser = (userId, userData, callback) => {
    const { role_id, full_name, email, phone, password, is_active } = userData;

    // Mã hóa mật khẩu nếu có
    const hashedPassword = password ? bcrypt.hashSync(password, 8) : null;

    // Xây dựng câu lệnh SQL động
    const fields = [];
    const values = [];

    if (role_id !== undefined) {
        fields.push('role_id = ?');
        values.push(role_id);
    }
    if (full_name) {
        fields.push('full_name = ?');
        values.push(full_name);
    }
    if (email) {
        fields.push('email = ?');
        values.push(email);
    }
    if (phone !== undefined) {
        fields.push('phone = ?');
        values.push(phone);
    }
    if (hashedPassword) {
        fields.push('password = ?');
        values.push(hashedPassword);
    }
    if (is_active !== undefined) {
        fields.push('is_active = ?');
        values.push(is_active);
    }

    if (fields.length === 0) {
        return callback(new Error('No fields to update'), null);
    }

    values.push(userId);

    const query = `UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`;

    db.query(query, values, (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { 
            user_id: userId, 
            role_id, 
            full_name, 
            email, 
            phone, 
            is_active 
        });
    });
};

// Xóa một người dùng (soft delete - set is_active = 0)
exports.deleteUser = (userId, callback) => {
    db.query('UPDATE users SET is_active = 0 WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'User deactivated successfully' });
    });
};

// Xóa vĩnh viễn người dùng
exports.hardDeleteUser = (userId, callback) => {
    db.query('DELETE FROM users WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'User deleted permanently' });
    });
};

// Kích hoạt lại người dùng
exports.activateUser = (userId, callback) => {
    db.query('UPDATE users SET is_active = 1 WHERE user_id = ?', [userId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'User activated successfully' });
    });
};

// Verify password
exports.verifyPassword = (plainPassword, storedPassword) => {
    if (!storedPassword) return false;

    if (exports.isBcryptHash(storedPassword)) {
        return bcrypt.compareSync(plainPassword, storedPassword);
    }

    // legacy plaintext
    return plainPassword === storedPassword;
};

exports.updatePasswordHash = (userId, hashedPassword, callback) => {
  db.query(
    'UPDATE users SET password = ? WHERE user_id = ?',
    [hashedPassword, userId],
    (err) => callback(err, null)
  );
};

exports.isBcryptHash = (value) => {
  if (!value) return false;
  return /^\$2[aby]\$/.test(String(value));
};
