const express = require('express');
const toursController = require('../controllers/toursController');

const router = express.Router();

// Lấy tất cả tours
router.get('/tours', toursController.getAllTours);

// Lấy tours theo region (đặt TRƯỚC /tours/:id)
router.get('/tours/region/:regionId', toursController.getToursByRegion);

// Lấy tours theo status (đặt TRƯỚC /tours/:id)
router.get('/tours/status/:status', toursController.getToursByStatus);

// Lấy tour theo ID
router.get('/tours/:id', toursController.getTourById);

// Tạo tour mới
router.post('/tours', toursController.createTour);

// Cập nhật tour
router.put('/tours/:id', toursController.updateTour);

// Cập nhật status tour (admin/office dùng)
router.patch('/tours/:id/status', toursController.updateTourStatus);

// Hướng dẫn viên xác nhận hoàn thành
router.patch('/tours/:id/finish', toursController.finishTour);

// Xóa tour
router.delete('/tours/:id', toursController.deleteTour);

module.exports = router;
