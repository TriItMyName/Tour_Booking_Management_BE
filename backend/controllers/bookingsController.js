const Booking = require('../models/bookingsModel');

// Lấy tất cả bookings
exports.getAllBookings = (req, res) => {
    Booking.getAllBookings((err, bookings) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving bookings',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            data: bookings
        });
    });
};

// Lấy booking theo ID
exports.getBookingById = (req, res) => {
    const bookingId = req.params.id;

    Booking.getBookingById(bookingId, (err, booking) => {
        if (err) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            data: booking
        });
    });
};

// Lấy bookings theo tour
exports.getBookingsByTourId = (req, res) => {
    const tourId = req.params.tourId;

    Booking.getBookingsByTourId(tourId, (err, bookings) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving bookings',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            data: bookings
        });
    });
};

// Lấy bookings theo user
exports.getBookingsByUserId = (req, res) => {
    const userId = req.params.userId;

    Booking.getBookingsByUserId(userId, (err, bookings) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving bookings',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            data: bookings
        });
    });
};

// Lấy bookings theo status
exports.getBookingsByStatus = (req, res) => {
    const status = req.params.status;

    Booking.getBookingsByStatus(status, (err, bookings) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving bookings',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            data: bookings
        });
    });
};

// Tạo booking mới
exports.createBooking = (req, res) => {
    const { tour_id, user_id, booking_status } = req.body;

    if (!tour_id || !user_id) {
        return res.status(400).json({
            success: false,
            message: 'tour_id and user_id are required'
        });
    }

    const bookingData = { tour_id, user_id, booking_status };

    Booking.createBooking(bookingData, (err, newBooking) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error creating booking',
                error: err.message
            });
        }
        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: newBooking
        });
    });
};

// Cập nhật booking status
exports.updateBookingStatus = (req, res) => {
    const bookingId = req.params.id;
    const { booking_status } = req.body;

    if (!booking_status) {
        return res.status(400).json({
            success: false,
            message: 'booking_status is required'
        });
    }

    Booking.updateBookingStatus(bookingId, booking_status, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error updating booking status',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            data: result
        });
    });
};

// Xóa booking
exports.deleteBooking = (req, res) => {
    const bookingId = req.params.id;

    Booking.deleteBooking(bookingId, (err, result) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error deleting booking',
                error: err.message
            });
        }
        res.status(200).json({
            success: true,
            message: result.message
        });
    });
};

// Bấm "Có": OPEN -> DRAFT + insert booking + insert notification
exports.bookAndCloseTour = (req, res) => {
    const { tour_id, user_id } = req.body;

    if (!tour_id || !user_id) {
        return res.status(400).json({
            success: false,
            message: 'tour_id and user_id are required'
        });
    }

    Booking.bookAndCloseTour(tour_id, user_id, (err, result) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Book & close tour failed',
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Booked + tour set to DRAFT + notification created',
            data: result
        });
    });
};

// ✅ Office decision: APPROVE / REJECT (nhận booking_id hoặc tour_id)
exports.officeDecision = (req, res) => {
    const { booking_id, tour_id, decision, guide_id } = req.body;

    Booking.officeDecision({ booking_id, tour_id, decision, guide_id }, (err, result) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Office decision failed',
                error: err.message
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Office decision success',
            data: result
        });
    });
};
