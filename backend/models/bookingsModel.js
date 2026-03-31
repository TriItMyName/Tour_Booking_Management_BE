const db = require('../config/db');

exports.getAllBookings = (callback) => {
  db.query('SELECT * FROM bookings', (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.getBookingById = (bookingId, callback) => {
  db.query(
    'SELECT * FROM bookings WHERE booking_id = ?',
    [bookingId],
    (err, results) => {
      if (err) return callback(err, null);
      if (!results || results.length === 0) return callback(new Error('Booking not found'), null);
      callback(null, results[0]);
    }
  );
};

exports.getBookingsByTourId = (tourId, callback) => {
  db.query('SELECT * FROM bookings WHERE tour_id = ?', [tourId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.getBookingsByUserId = (userId, callback) => {
  db.query('SELECT * FROM bookings WHERE user_id = ?', [userId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.getBookingsByStatus = (status, callback) => {
  db.query('SELECT * FROM bookings WHERE booking_status = ?', [status], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.createBooking = (bookingData, callback) => {
  const { tour_id, user_id, booking_status } = bookingData;

  if (!tour_id || !user_id) {
    return callback(new Error('tour_id and user_id are required'), null);
  }

  db.query(
    'INSERT INTO bookings (tour_id, user_id, booking_status) VALUES (?, ?, ?)',
    [tour_id, user_id, booking_status || 'PENDING'],
    (err, results) => {
      if (err) return callback(err, null);
      callback(null, {
        booking_id: results.insertId,
        tour_id,
        user_id,
        booking_status: booking_status || 'PENDING'
      });
    }
  );
};

exports.updateBookingStatus = (bookingId, status, callback) => {
  db.query(
    'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
    [status, bookingId],
    (err) => {
      if (err) return callback(err, null);
      callback(null, { booking_id: bookingId, booking_status: status });
    }
  );
};

exports.deleteBooking = (bookingId, callback) => {
  db.query('DELETE FROM bookings WHERE booking_id = ?', [bookingId], (err) => {
    if (err) return callback(err, null);
    callback(null, { message: 'Booking deleted successfully' });
  });
};

exports.bookAndCloseTour = (tour_id, user_id, callback) => {
  if (!tour_id || !user_id) {
    return callback(new Error('tour_id and user_id are required'), null);
  }

  const defaultContent = 'Chuyến đi của bạn đang được xét duyệt';

  db.beginTransaction((err) => {
    if (err) return callback(err, null);

    db.query(
      "UPDATE tours SET status = 'DRAFT' WHERE tour_id = ? AND status = 'OPEN'",
      [tour_id],
      (err1, r1) => {
        if (err1) return db.rollback(() => callback(err1, null));

        if (!r1 || r1.affectedRows === 0) {
          return db.rollback(() =>
            callback(new Error('Tour not OPEN (or not found)'), null)
          );
        }

        db.query(
          "INSERT INTO bookings (tour_id, user_id, booking_status) VALUES (?, ?, 'PENDING')",
          [tour_id, user_id],
          (err2, r2) => {
            if (err2) return db.rollback(() => callback(err2, null));

            const bookingId = r2.insertId;

            db.query(
              "INSERT INTO notifications (user_id, content, is_read) VALUES (?, ?, 0)",
              [user_id, defaultContent],
              (err3, r3) => {
                if (err3) return db.rollback(() => callback(err3, null));

                const notificationId = r3.insertId;

                db.commit((err4) => {
                  if (err4) return db.rollback(() => callback(err4, null));

                  return callback(null, {
                    booking_id: bookingId,
                    notification_id: notificationId,
                    tour_id,
                    user_id,
                    booking_status: 'PENDING',
                    tour_status: 'DRAFT',
                    notification_content: defaultContent
                  });
                });
              }
            );
          }
        );
      }
    );
  });
};

exports.officeDecision = ({ booking_id, tour_id, decision, guide_id }, callback) => {
  const dec = String(decision || '').trim().toUpperCase();
  const isApprove = dec === 'APPROVE';
  const isReject = dec === 'REJECT';

  if (!isApprove && !isReject) {
    return callback(new Error("decision must be 'APPROVE' or 'REJECT'"), null);
  }

  if (!booking_id && !tour_id) {
    return callback(new Error('booking_id or tour_id is required'), null);
  }

  db.beginTransaction((err) => {
    if (err) return callback(err, null);

    const selectBookingSql = booking_id
      ? 'SELECT * FROM bookings WHERE booking_id = ? FOR UPDATE'
      : "SELECT * FROM bookings WHERE tour_id = ? AND booking_status = 'PENDING' ORDER BY booking_id DESC LIMIT 1 FOR UPDATE";

    const selectParams = booking_id ? [Number(booking_id)] : [Number(tour_id)];

    db.query(selectBookingSql, selectParams, (e1, rows) => {
      if (e1) return db.rollback(() => callback(e1, null));

      const bookingRow = Array.isArray(rows) ? rows[0] : null;
      if (!bookingRow) {
        return db.rollback(() => callback(new Error('Booking not found'), null));
      }

      const bId = bookingRow.booking_id;
      const tId = bookingRow.tour_id;
      const uId = bookingRow.user_id;

      const nextTourStatus = isApprove ? 'ONGOING' : 'OPEN';
      const nextBookingStatus = isApprove ? 'APPROVED' : 'REJECTED';
      const notiContent = isApprove ? 'Tour đã được xét duyệt' : 'Tour đã bị từ chối';

      const guideId = Number(guide_id || 0);
      if (isApprove && !guideId) {
        return db.rollback(() => callback(new Error('guide_id is required for APPROVE'), null));
      }

      const ensureGuideAvailableAndAssign = (done) => {
        if (!isApprove) {
          // Reject: clear any assignment for this tour
          return db.query(
            'DELETE FROM tour_assignments WHERE tour_id = ?',
            [tId],
            (delErr) => {
              if (delErr) return db.rollback(() => callback(delErr, null));
              return done();
            }
          );
        }

        // Approve: check overlap then set assignment (replace existing)
        const conflictSql = `
          SELECT 1
          FROM tour_assignments ta
          JOIN tours t ON t.tour_id = ta.tour_id
          JOIN tours tcur ON tcur.tour_id = ?
          WHERE ta.guide_id = ?
            AND t.status IN ('DRAFT','OPEN','ONGOING')
            AND NOT (t.end_date < tcur.start_date OR t.start_date > tcur.end_date)
          LIMIT 1
        `;

        db.query(conflictSql, [tId, guideId], (cErr, cRows) => {
          if (cErr) return db.rollback(() => callback(cErr, null));
          if (Array.isArray(cRows) && cRows.length > 0) {
            return db.rollback(() => callback(new Error('Guide is not available for this tour schedule'), null));
          }

          db.query('DELETE FROM tour_assignments WHERE tour_id = ?', [tId], (dErr) => {
            if (dErr) return db.rollback(() => callback(dErr, null));

            db.query(
              'INSERT INTO tour_assignments (tour_id, guide_id) VALUES (?, ?)',
              [tId, guideId],
              (iErr) => {
                if (iErr) return db.rollback(() => callback(iErr, null));
                return done();
              }
            );
          });
        });
      };

      ensureGuideAvailableAndAssign(() => {
        db.query(
          'UPDATE tours SET status = ? WHERE tour_id = ?',
          [nextTourStatus, tId],
          (e2) => {
            if (e2) return db.rollback(() => callback(e2, null));

            db.query(
              'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
              [nextBookingStatus, bId],
              (e3) => {
                if (e3) return db.rollback(() => callback(e3, null));

                db.query(
                  'INSERT INTO notifications (user_id, content, is_read) VALUES (?, ?, 0)',
                  [uId, notiContent],
                  (e4, r4) => {
                    if (e4) return db.rollback(() => callback(e4, null));

                    const notificationId = r4.insertId;

                    db.commit((e5) => {
                      if (e5) return db.rollback(() => callback(e5, null));

                      return callback(null, {
                        booking_id: bId,
                        tour_id: tId,
                        user_id: uId,
                        booking_status: nextBookingStatus,
                        tour_status: nextTourStatus,
                        guide_id: isApprove ? guideId : null,
                        notification_id: notificationId,
                        notification_content: notiContent
                      });
                    });
                  }
                );
              }
            );
          }
        );
      });
    });
  });
};
