const User = require('../models/usersModel');
const LoginHistory = require('../models/loginHistoryModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const SECRET_KEY = process.env.JWT_SECRET || '12345678';

function isNotFoundError(err) {
    return err && typeof err.message === 'string' && err.message.toLowerCase().includes('not found');
}

function getClientIp(req) {
    const xff = req.headers['x-forwarded-for'];
    if (typeof xff === 'string' && xff.trim()) {
        return xff.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (typeof realIp === 'string' && realIp.trim()) {
        return realIp.trim();
    }
    return req.ip || null;
}

// Đăng nhập
exports.loginUser = (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email và password là bắt buộc'
        });
    }

    User.getUserByEmail(email, (err, user) => {
        // Sai thông tin đăng nhập: không tiết lộ email tồn tại hay không
        if (err || !user || !user.password) {
            return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }

        const passwordValid = User.verifyPassword(password, user.password);
        if (!passwordValid) {
            return res.status(401).json({ success: false, message: 'Sai thông tin đăng nhập' });
        }

        // MIGRATE: nếu password trong DB chưa phải bcrypt => hash lại và update
        if (!User.isBcryptHash(user.password)) {
            const newHash = bcrypt.hashSync(password, 8);
            User.updatePasswordHash(user.user_id, newHash, (updateErr) => {
                // Không chặn login nếu migrate lỗi, chỉ log để bạn theo dõi
                if (updateErr) console.error('Failed to migrate legacy password for user', user.user_id, updateErr);
            });
        }

        const token = jwt.sign(
            { user_id: user.user_id, role_id: user.role_id, email: user.email },
            SECRET_KEY,
            { expiresIn: '2h' }
        );

        const { password: _, ...userSafe } = user;

        // Ghi lịch sử đăng nhập (không ghi cho Admin role_id=5)
        const roleId = Number(user.role_id);
        if (roleId !== 5) {
            LoginHistory.createLoginHistory(
                {
                    user_id: user.user_id,
                    ip_address: getClientIp(req),
                    login_status: 'SUCCESS',
                },
                (logErr) => {
                    if (logErr) {
                        console.error('Failed to write login history for user', user.user_id, logErr);
                    }
                }
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: userSafe,
            token
        });
    });
};

// Lấy tất cả người dùng
exports.getAllUsers = (req, res) => {
    User.getAllUsers((err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving users',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: users
        });
    });
};

// Lấy người dùng theo ID
exports.getUserById = (req, res) => {
    const userId = req.params.id;

    User.getUserById(userId, (err, user) => {
        if (err) {
            const code = isNotFoundError(err) ? 404 : 500;
            return res.status(code).json({
                success: false,
                message: isNotFoundError(err) ? 'User not found' : 'Error retrieving user',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: user
        });
    });
};

// Lấy người dùng theo email
exports.getUserByEmail = (req, res) => {
    const email = req.params.email;

    User.getUserByEmail(email, (err, user) => {
        if (err) {
            const code = isNotFoundError(err) ? 404 : 500;
            return res.status(code).json({
                success: false,
                message: isNotFoundError(err) ? 'User not found' : 'Error retrieving user',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: user
        });
    });
};

// Lấy người dùng theo role
exports.getUsersByRole = (req, res) => {
    const roleId = req.params.roleId;

    User.getUsersByRole(roleId, (err, users) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving users by role',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: users
        });
    });
};

// Tạo người dùng mới
exports.createUser = (req, res) => {
    const { role_id, full_name, email, phone, password, is_active } = req.body || {};

    if (!role_id || !full_name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: 'role_id, full_name, email, and password are required'
        });
    }

    const userData = { role_id, full_name, email, phone, password, is_active };

    User.createUser(userData, (err, newUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error creating user',
                error: err.message
            });
        }
        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });
    });
};

// Cập nhật người dùng
exports.updateUser = (req, res) => {
    const userId = req.params.id;
    const { role_id, full_name, email, phone, password, is_active } = req.body || {};

    const userData = { role_id, full_name, email, phone, password, is_active };

    User.updateUser(userId, userData, (err, updatedUser) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error updating user',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser
        });
    });
};

// Xóa người dùng (soft delete)
exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    User.deleteUser(userId, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error deleting user',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message
        });
    });
};

// Xóa vĩnh viễn người dùng
exports.hardDeleteUser = (req, res) => {
    const userId = req.params.id;

    User.hardDeleteUser(userId, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error deleting user permanently',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message
        });
    });
};

// Kích hoạt lại người dùng
exports.activateUser = (req, res) => {
    const userId = req.params.id;

    User.activateUser(userId, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error activating user',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message
        });
    });
};
