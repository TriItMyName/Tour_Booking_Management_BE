const express = require('express');
const tourAssignmentsController = require('../controllers/tourAssignmentsController');

const router = express.Router();

// Lấy danh sách guide rảnh cho 1 tour (không trùng lịch)
router.get('/assignments/available-guides/tour/:tourId', tourAssignmentsController.getAvailableGuidesForTour);

// Lấy tất cả assignments
router.get('/assignments', tourAssignmentsController.getAllAssignments);

// Lấy assignment theo ID
router.get('/assignments/:id', tourAssignmentsController.getAssignmentById);

// Lấy assignments theo tour
router.get('/assignments/tour/:tourId', tourAssignmentsController.getAssignmentsByTourId);

// Lấy assignments theo guide
router.get('/assignments/guide/:guideId', tourAssignmentsController.getAssignmentsByGuideId);

// Tạo assignment mới
router.post('/assignments', tourAssignmentsController.createAssignment);

// Cập nhật assignment
router.put('/assignments/:id', tourAssignmentsController.updateAssignment);

// Xóa assignment
router.delete('/assignments/:id', tourAssignmentsController.deleteAssignment);

module.exports = router;
