const db = require('../config/db');

// Lấy tất cả tour assignments
exports.getAllAssignments = (callback) => {
    db.query('SELECT * FROM tour_assignments', (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Lấy assignment theo ID
exports.getAssignmentById = (assignmentId, callback) => {
    db.query('SELECT * FROM tour_assignments WHERE assignment_id = ?', [assignmentId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('Assignment not found'), null);
        }
        callback(null, results[0]);
    });
};

// Lấy assignments theo tour
exports.getAssignmentsByTourId = (tourId, callback) => {
    db.query('SELECT * FROM tour_assignments WHERE tour_id = ?', [tourId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Lấy assignments theo guide
exports.getAssignmentsByGuideId = (guideId, callback) => {
    db.query('SELECT * FROM tour_assignments WHERE guide_id = ?', [guideId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Tạo assignment mới
exports.createAssignment = (assignmentData, callback) => {
    const { tour_id, guide_id } = assignmentData;

    if (!tour_id || !guide_id) {
        return callback(new Error('tour_id and guide_id are required'), null);
    }

    db.query(
        'INSERT INTO tour_assignments (tour_id, guide_id) VALUES (?, ?)',
        [tour_id, guide_id],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { 
                assignment_id: results.insertId, 
                tour_id, 
                guide_id 
            });
        }
    );
};

// Cập nhật assignment
exports.updateAssignment = (assignmentId, assignmentData, callback) => {
    const { tour_id, guide_id } = assignmentData;

    const fields = [];
    const values = [];

    if (tour_id !== undefined) {
        fields.push('tour_id = ?');
        values.push(tour_id);
    }
    if (guide_id !== undefined) {
        fields.push('guide_id = ?');
        values.push(guide_id);
    }

    if (fields.length === 0) {
        return callback(new Error('No fields to update'), null);
    }

    values.push(assignmentId);
    const query = `UPDATE tour_assignments SET ${fields.join(', ')} WHERE assignment_id = ?`;

    db.query(query, values, (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { assignment_id: assignmentId, ...assignmentData });
    });
};

// Xóa assignment
exports.deleteAssignment = (assignmentId, callback) => {
    db.query('DELETE FROM tour_assignments WHERE assignment_id = ?', [assignmentId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'Assignment deleted successfully' });
    });
};

// Lấy danh sách guide rảnh cho tourId (không trùng lịch với tour đang DRAFT/OPEN/ONGOING)
exports.getAvailableGuidesForTour = (tourId, callback) => {
    const id = Number(tourId);
    if (!id) return callback(new Error('tourId is required'), null);

    const sql = `
        SELECT u.user_id, u.full_name
        FROM users u
        JOIN tours tcur ON tcur.tour_id = ?
        WHERE u.role_id = 2
          AND u.is_active = 1
          AND NOT EXISTS (
            SELECT 1
            FROM tour_assignments ta
            JOIN tours t ON t.tour_id = ta.tour_id
            WHERE ta.guide_id = u.user_id
              AND t.status IN ('DRAFT','OPEN','ONGOING')
              AND NOT (t.end_date < tcur.start_date OR t.start_date > tcur.end_date)
          )
        ORDER BY u.full_name ASC
    `;

    db.query(sql, [id], (err, results) => {
        if (err) return callback(err, null);
        callback(null, results || []);
    });
};
