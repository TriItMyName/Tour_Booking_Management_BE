const express = require('express');
const bookingsController = require('../controllers/bookingsController');

const router = express.Router();

// Lấy tất cả bookings
router.get('/bookings', bookingsController.getAllBookings);

// Lấy booking theo ID
router.get('/bookings/:id', bookingsController.getBookingById);

// Lấy bookings theo tour
router.get('/bookings/tour/:tourId', bookingsController.getBookingsByTourId);

// Lấy bookings theo user
router.get('/bookings/user/:userId', bookingsController.getBookingsByUserId);

// Lấy bookings theo status
router.get('/bookings/status/:status', bookingsController.getBookingsByStatus);

// Tạo booking mới
router.post('/bookings', bookingsController.createBooking);

// ✅ Customer bấm "Có": OPEN -> DRAFT + booking + notification
router.post('/bookings/book-and-close', bookingsController.bookAndCloseTour);

// ✅ Office decision: APPROVE / REJECT
router.post('/bookings/office-decision', bookingsController.officeDecision);

// Cập nhật booking status
router.patch('/bookings/:id/status', bookingsController.updateBookingStatus);

// Xóa booking
router.delete('/bookings/:id', bookingsController.deleteBooking);

module.exports = router;
