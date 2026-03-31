const LoginHistory = require('../models/loginHistoryModel');
const User = require('../models/usersModel');

// Lấy tất cả login history
exports.getAllLoginHistory = (req, res) => {
    LoginHistory.getAllLoginHistory((err, history) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving login history', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: history 
        });
    });
};

// Lấy login history theo user
exports.getLoginHistoryByUserId = (req, res) => {
    const userId = req.params.userId;
    
    LoginHistory.getLoginHistoryByUserId(userId, (err, history) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving login history', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: history 
        });
    });
};

// Lấy login history theo status
exports.getLoginHistoryByStatus = (req, res) => {
    const status = req.params.status;
    
    LoginHistory.getLoginHistoryByStatus(status, (err, history) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving login history', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: history 
        });
    });
};

// Tạo login history record
exports.createLoginHistory = (req, res) => {
    const { user_id, ip_address, login_status } = req.body;

    if (!user_id || !login_status) {
        return res.status(400).json({ 
            success: false, 
            message: 'user_id and login_status are required' 
        });
    }

    const normalizedStatus = String(login_status).toUpperCase();
    if (normalizedStatus !== 'SUCCESS' && normalizedStatus !== 'FAILED') {
        return res.status(400).json({
            success: false,
            message: 'login_status must be SUCCESS or FAILED'
        });
    }

    // Không lưu lịch sử đăng nhập của Admin (role_id=5)
    User.getUserById(user_id, (userErr, user) => {
        if (userErr || !user) {
            const code = userErr && String(userErr.message || '').toLowerCase().includes('not found') ? 404 : 500;
            return res.status(code).json({
                success: false,
                message: code === 404 ? 'User not found' : 'Error validating user',
                error: userErr?.message,
            });
        }

        if (Number(user.role_id) === 5) {
            return res.status(200).json({
                success: true,
                message: 'Skipped: admin login history is not recorded',
                data: null,
            });
        }

        const loginData = {
            user_id,
            ip_address,
            login_status: normalizedStatus
        };

        LoginHistory.createLoginHistory(loginData, (err, newRecord) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error creating login history', 
                    error: err.message 
                });
            }
            res.status(201).json({ 
                success: true, 
                message: 'Login history created successfully', 
                data: newRecord 
            });
        });
    });
};

// Xóa login history cũ
exports.deleteOldLoginHistory = (req, res) => {
    const days = req.params.days || 90;
    
    LoginHistory.deleteOldLoginHistory(days, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting old login history', 
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
