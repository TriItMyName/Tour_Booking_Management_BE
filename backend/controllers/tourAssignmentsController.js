const TourAssignment = require('../models/tourAssignmentsModel');

// Lấy danh sách guide rảnh cho 1 tour (không trùng lịch)
exports.getAvailableGuidesForTour = (req, res) => {
    const tourId = Number(req.params.tourId);

    if (!tourId) {
        return res.status(400).json({
            success: false,
            message: 'tourId is required'
        });
    }

    TourAssignment.getAvailableGuidesForTour(tourId, (err, guides) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving available guides',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: guides
        });
    });
};

// Lấy tất cả assignments
exports.getAllAssignments = (req, res) => {
    TourAssignment.getAllAssignments((err, assignments) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving assignments', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: assignments 
        });
    });
};

// Lấy assignment theo ID
exports.getAssignmentById = (req, res) => {
    const assignmentId = req.params.id;
    
    TourAssignment.getAssignmentById(assignmentId, (err, assignment) => {
        if (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Assignment not found', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: assignment 
        });
    });
};

// Lấy assignments theo tour
exports.getAssignmentsByTourId = (req, res) => {
    const tourId = req.params.tourId;
    
    TourAssignment.getAssignmentsByTourId(tourId, (err, assignments) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving assignments', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: assignments 
        });
    });
};

// Lấy assignments theo guide
exports.getAssignmentsByGuideId = (req, res) => {
    const guideId = req.params.guideId;
    
    TourAssignment.getAssignmentsByGuideId(guideId, (err, assignments) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving assignments', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: assignments 
        });
    });
};

// Tạo assignment mới
exports.createAssignment = (req, res) => {
    const { tour_id, guide_id } = req.body;

    if (!tour_id || !guide_id) {
        return res.status(400).json({ 
            success: false, 
            message: 'tour_id and guide_id are required' 
        });
    }

    const assignmentData = {
        tour_id,
        guide_id
    };

    TourAssignment.createAssignment(assignmentData, (err, newAssignment) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error creating assignment', 
                error: err.message 
            });
        }
        res.status(201).json({ 
            success: true, 
            message: 'Assignment created successfully', 
            data: newAssignment 
        });
    });
};

// Cập nhật assignment
exports.updateAssignment = (req, res) => {
    const assignmentId = req.params.id;
    const assignmentData = req.body;

    TourAssignment.updateAssignment(assignmentId, assignmentData, (err, updatedAssignment) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error updating assignment', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: 'Assignment updated successfully', 
            data: updatedAssignment 
        });
    });
};

// Xóa assignment
exports.deleteAssignment = (req, res) => {
    const assignmentId = req.params.id;
    
    TourAssignment.deleteAssignment(assignmentId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting assignment', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    });
};
