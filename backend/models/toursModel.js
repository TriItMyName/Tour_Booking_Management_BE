const db = require('../config/db');

exports.getAllTours = (callback) => {
  db.query('SELECT * FROM tours', (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.getTourById = (tourId, callback) => {
  db.query('SELECT * FROM tours WHERE tour_id = ?', [tourId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(new Error('Tour not found'), null);
    callback(null, results[0]);
  });
};

exports.getToursByRegion = (regionId, callback) => {
  db.query('SELECT * FROM tours WHERE region_id = ?', [regionId], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.getToursByStatus = (status, callback) => {
  db.query('SELECT * FROM tours WHERE status = ?', [status], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

exports.createTour = (tourData, callback) => {
  const { tour_name, description, start_date, end_date, max_participants, status, region_id } = tourData;

  if (!tour_name || !start_date || !end_date || !max_participants || !region_id) {
    return callback(new Error('Tour name, dates, max_participants, and region_id are required'), null);
  }

  db.query(
    'INSERT INTO tours (tour_name, description, start_date, end_date, max_participants, status, region_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [tour_name, description, start_date, end_date, max_participants, status || 'DRAFT', region_id],
    (err, results) => {
      if (err) return callback(err, null);
      callback(null, {
        tour_id: results.insertId,
        tour_name,
        description,
        start_date,
        end_date,
        max_participants,
        status: status || 'DRAFT',
        region_id
      });
    }
  );
};

exports.updateTour = (tourId, tourData, callback) => {
  const { tour_name, description, start_date, end_date, max_participants, status, region_id } = tourData;

  const fields = [];
  const values = [];

  if (tour_name) { fields.push('tour_name = ?'); values.push(tour_name); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (start_date) { fields.push('start_date = ?'); values.push(start_date); }
  if (end_date) { fields.push('end_date = ?'); values.push(end_date); }
  if (max_participants !== undefined) { fields.push('max_participants = ?'); values.push(max_participants); }
  if (status) { fields.push('status = ?'); values.push(status); }
  if (region_id !== undefined) { fields.push('region_id = ?'); values.push(region_id); }

  if (fields.length === 0) return callback(new Error('No fields to update'), null);

  values.push(tourId);
  const query = `UPDATE tours SET ${fields.join(', ')} WHERE tour_id = ?`;

  db.query(query, values, (err) => {
    if (err) return callback(err, null);
    callback(null, { tour_id: tourId, ...tourData });
  });
};

exports.deleteTour = (tourId, callback) => {
  db.query('DELETE FROM tours WHERE tour_id = ?', [tourId], (err) => {
    if (err) return callback(err, null);
    callback(null, { message: 'Tour deleted successfully' });
  });
};

exports.updateTourStatus = (tourId, status, callback) => {
  db.query(
    'UPDATE tours SET status = ? WHERE tour_id = ?',
    [status, tourId],
    (err) => {
      if (err) return callback(err, null);
      callback(null, { tour_id: tourId, status });
    }
  );
};

exports.autoUpdateOngoing = (callback) => {
  db.query(
    `
      UPDATE tours
      SET status = 'ONGOING'
      WHERE status = 'OPEN'
        AND start_date <= NOW()
    `,
    (err, results) => {
      if (err) return callback(err, null);
      return callback(null, { affectedRows: results.affectedRows });
    }
  );
};

exports.finishTour = (tourId, guideId, callback) => {
  db.query(
    `
      UPDATE tours t
      JOIN tour_assignments ta ON ta.tour_id = t.tour_id
      SET t.status = 'FINISHED'
      WHERE t.tour_id = ?
        AND t.status = 'ONGOING'
        AND ta.guide_id = ?
    `,
    [tourId, guideId],
    (err, results) => {
      if (err) return callback(err, null);
      return callback(null, { affectedRows: results.affectedRows, tour_id: tourId, status: 'FINISHED' });
    }
  );
};
