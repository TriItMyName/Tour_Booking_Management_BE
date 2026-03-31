const express = require('express');
const rolesController = require('../controllers/rolesController');

const router = express.Router();

// Lấy tất cả roles
router.get('/roles', rolesController.getAllRoles);

// Lấy role theo ID
router.get('/roles/:id', rolesController.getRoleById);

// Lấy role theo tên
router.get('/roles/name/:name', rolesController.getRoleByName);

// Tạo role mới
router.post('/roles', rolesController.createRole);

// Cập nhật role
router.put('/roles/:id', rolesController.updateRole);

// Xóa role
router.delete('/roles/:id', rolesController.deleteRole);

module.exports = router;
