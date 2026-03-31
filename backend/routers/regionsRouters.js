const express = require('express');
const regionsController = require('../controllers/regionsController');

const router = express.Router();

// Lấy tất cả regions
router.get('/regions', regionsController.getAllRegions);

// Lấy region theo ID
router.get('/regions/:id', regionsController.getRegionById);

// Lấy region theo tên
router.get('/regions/name/:name', regionsController.getRegionByName);

// Tạo region mới
router.post('/regions', regionsController.createRegion);

// Cập nhật region
router.put('/regions/:id', regionsController.updateRegion);

// Xóa region
router.delete('/regions/:id', regionsController.deleteRegion);

module.exports = router;
