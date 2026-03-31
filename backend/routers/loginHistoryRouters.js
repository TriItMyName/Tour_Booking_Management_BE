const express = require('express');
const loginHistoryController = require('../controllers/loginHistoryController');

const router = express.Router();

// Lấy tất cả login history
router.get('/login-history', loginHistoryController.getAllLoginHistory);

// Lấy login history theo user
router.get('/login-history/user/:userId', loginHistoryController.getLoginHistoryByUserId);

// Lấy login history theo status
router.get('/login-history/status/:status', loginHistoryController.getLoginHistoryByStatus);

// Tạo login history record
router.post('/login-history', loginHistoryController.createLoginHistory);

// Xóa login history cũ
router.delete('/login-history/old/:days', loginHistoryController.deleteOldLoginHistory);

module.exports = router;
