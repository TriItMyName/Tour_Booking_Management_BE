const express = require('express');
const usersController = require('../controllers/usersController');

const router = express.Router();

// Lấy tất cả người dùng
router.get('/users', usersController.getAllUsers);

// Lấy người dùng theo ID
router.get('/users/:id', usersController.getUserById);

// Lấy người dùng theo email
router.get('/users/email/:email', usersController.getUserByEmail);

// Lấy người dùng theo role
router.get('/users/role/:roleId', usersController.getUsersByRole);

// Tạo người dùng mới
router.post('/users', usersController.createUser);

// Đăng nhập
router.post('/users/login', usersController.loginUser);

// Cập nhật người dùng
router.put('/users/:id', usersController.updateUser);

// Xóa người dùng (soft delete)
router.delete('/users/:id', usersController.deleteUser);

// Xóa vĩnh viễn người dùng
router.delete('/users/:id/hard', usersController.hardDeleteUser);

// Kích hoạt lại người dùng
router.patch('/users/:id/activate', usersController.activateUser);

module.exports = router;
