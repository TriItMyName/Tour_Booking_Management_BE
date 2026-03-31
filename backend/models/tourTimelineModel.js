const db = require('../config/db');

exports.getTimelineByTourId = (tourId, callback) => {
  db.query(
    'SELECT * FROM tour_timeline WHERE tour_id = ? ORDER BY day_number ASC, event_time ASC',
    [Number(tourId)],
    (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    }
  );
};

exports.getTimelineById = (timelineId, callback) => {
  db.query(
    'SELECT * FROM tour_timeline WHERE timeline_id = ?',
    [Number(timelineId)],
    (err, results) => {
      if (err) return callback(err, null);
      if (!results || results.length === 0) {
        return callback(new Error('Timeline not found'), null);
      }
      callback(null, results[0]);
    }
  );
};

exports.createTimeline = (data, callback) => {
  const { tour_id, day_number, event_time, location, description, is_completed } = data;

  db.query(
    `INSERT INTO tour_timeline
      (tour_id, day_number, event_time, location, description, is_completed)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      Number(tour_id),
      Number(day_number),
      event_time,
      location ?? null,
      description ?? null,
      Number(is_completed ?? 0)
    ],
    (err, results) => {
      if (err) return callback(err, null);
      callback(null, {
        timeline_id: results.insertId,
        tour_id: Number(tour_id),
        day_number: Number(day_number),
        event_time,
        location: location ?? null,
        description: description ?? null,
        is_completed: Number(is_completed ?? 0)
      });
    }
  );
};

exports.updateTimeline = (timelineId, data, callback) => {
  const fields = [];
  const params = [];

  const map = {
    tour_id: 'tour_id',
    day_number: 'day_number',
    event_time: 'event_time',
    location: 'location',
    description: 'description',
    is_completed: 'is_completed'
  };

  Object.keys(map).forEach((k) => {
    if (data[k] !== undefined) {
      fields.push(`${map[k]} = ?`);
      params.push(data[k]);
    }
  });

  if (!fields.length) {
    return callback(new Error('No fields to update'), null);
  }

  params.push(Number(timelineId));

  db.query(
    `UPDATE tour_timeline SET ${fields.join(', ')} WHERE timeline_id = ?`,
    params,
    (err) => {
      if (err) return callback(err, null);
      callback(null, { timeline_id: Number(timelineId), ...data });
    }
  );
};

exports.deleteTimeline = (timelineId, callback) => {
  db.query(
    'DELETE FROM tour_timeline WHERE timeline_id = ?',
    [Number(timelineId)],
    (err) => {
      if (err) return callback(err, null);
      callback(null, { message: 'Timeline deleted successfully' });
    }
  );
};

exports.markTimelineCompleted = (timelineId, callback) => {
  db.query(
    'UPDATE tour_timeline SET is_completed = 1 WHERE timeline_id = ?',
    [Number(timelineId)],
    (err) => {
      if (err) return callback(err, null);
      callback(null, { message: 'Timeline marked as completed' });
    }
  );
};

exports.getScheduleByUserId = (userId, callback) => {
  const sql = `
    SELECT 
      t.tour_id,
      t.tour_name,
      t.start_date,
      t.end_date,
      t.max_participants,
      t.region_id,
      r.region_name
    FROM bookings b
    JOIN tours t ON b.tour_id = t.tour_id
    JOIN regions r ON t.region_id = r.region_id
    WHERE b.user_id = ?
      AND b.booking_status = 'APPROVED'
      AND t.status = 'ONGOING'
      AND b.booking_id = (
        SELECT MAX(b2.booking_id)
        FROM bookings b2
        WHERE b2.user_id = b.user_id
          AND b2.tour_id = b.tour_id
          AND b2.booking_status = 'APPROVED'
      )
    ORDER BY t.start_date DESC
  `;

  db.query(sql, [Number(userId)], (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows);
  });
};

exports.getScheduleByGuideId = (guideId, callback) => {
  const sql = `
    SELECT DISTINCT
      t.tour_id,
      t.tour_name,
      t.start_date,
      t.end_date,
      t.max_participants,
      t.region_id,
      r.region_name
    FROM tour_assignments ta
    JOIN tours t ON ta.tour_id = t.tour_id
    JOIN regions r ON t.region_id = r.region_id
    WHERE ta.guide_id = ?
      AND t.status = 'ONGOING'
    ORDER BY t.start_date DESC
  `;

  db.query(sql, [Number(guideId)], (err, rows) => {
    if (err) return callback(err, null);
    callback(null, rows);
  });
};
