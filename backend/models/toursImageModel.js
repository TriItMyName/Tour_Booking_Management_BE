const db = require('../config/db');

// Lấy tất cả hình ảnh tour
exports.getAllImages = (callback) => {
    db.query('SELECT * FROM tour_images', (err, results) => {
        if (err) return callback(err, null);
        return callback(null, results);
    });
};

// Lấy hình ảnh tour theo ID
exports.getImageById = (imageId, callback) => {
    db.query('SELECT * FROM tour_images WHERE image_id = ?', [imageId], (err, results) => {
        if (err) return callback(err, null);
        return callback(null, results[0] || null);
    });
};

// Lấy hình ảnh theo tour_id
exports.getImagesByTourId = (tourId, callback) => {
    db.query(
        'SELECT * FROM tour_images WHERE tour_id = ? ORDER BY is_main DESC, created_at DESC',
        [tourId],
        (err, results) => {
            if (err) return callback(err, null);
            return callback(null, results);
        }
    );
};

// (Giữ CRUD nếu bạn cần)
exports.createTourImage = (imageData, callback) => {
    const { tour_id, image_url, is_main } = imageData;

    if (!tour_id || !image_url) {
        return callback(new Error('tour_id and image_url are required'), null);
    }

    const main = is_main ? 1 : 0;

    db.query(
        'INSERT INTO tour_images (tour_id, image_url, is_main) VALUES (?, ?, ?)',
        [tour_id, image_url, main],
        (err, results) => {
            if (err) return callback(err, null);
            return callback(null, {
                image_id: results.insertId,
                tour_id,
                image_url,
                is_main: main
            });
        }
    );
};

exports.updateTourImage = (imageId, imageData, callback) => {
    const { tour_id, image_url, is_main } = imageData;

    db.query(
        'UPDATE tour_images SET tour_id = ?, image_url = ?, is_main = ? WHERE image_id = ?',
        [tour_id, image_url, is_main ? 1 : 0, imageId],
        (err, results) => {
            if (err) return callback(err, null);
            if (results.affectedRows === 0) return callback(null, null);
            return callback(null, { image_id: imageId, tour_id, image_url, is_main: is_main ? 1 : 0 });
        }
    );
};

exports.deleteTourImage = (imageId, callback) => {
    db.query('DELETE FROM tour_images WHERE image_id = ?', [imageId], (err, results) => {
        if (err) return callback(err, null);
        if (results.affectedRows === 0) return callback(null, null);
        return callback(null, { message: 'Tour image deleted successfully' });
    });
};

// Thêm nhiều ảnh cho 1 tour (bulk)
exports.createTourImagesBulk = (tourId, images, callback) => {
    const tid = Number(tourId);
    if (!tid || tid <= 0) return callback(new Error('Invalid tourId'), null);

    if (!Array.isArray(images) || images.length === 0) {
        return callback(new Error('images must be a non-empty array'), null);
    }

    const normalized = images
        .map((img) => ({
            image_url: String(img?.image_url ?? '').trim(),
            is_main: img?.is_main ? 1 : 0,
        }))
        .filter((img) => img.image_url);

    if (normalized.length === 0) {
        return callback(new Error('No valid image_url provided'), null);
    }

    // Nếu có nhiều ảnh main, chỉ lấy ảnh main đầu tiên
    let foundMain = false;
    for (const img of normalized) {
        if (img.is_main) {
            if (!foundMain) foundMain = true;
            else img.is_main = 0;
        }
    }

    db.beginTransaction((txErr) => {
        if (txErr) return callback(txErr, null);

        const doInsert = () => {
            const values = normalized.map((img) => [tid, img.image_url, img.is_main]);
            db.query(
                'INSERT INTO tour_images (tour_id, image_url, is_main) VALUES ?',
                [values],
                (insErr, results) => {
                    if (insErr) {
                        return db.rollback(() => callback(insErr, null));
                    }

                    db.commit((commitErr) => {
                        if (commitErr) {
                            return db.rollback(() => callback(commitErr, null));
                        }
                        return callback(null, {
                            inserted: results.affectedRows || 0,
                        });
                    });
                }
            );
        };

        if (foundMain) {
            db.query('UPDATE tour_images SET is_main = 0 WHERE tour_id = ?', [tid], (upErr) => {
                if (upErr) return db.rollback(() => callback(upErr, null));
                doInsert();
            });
        } else {
            doInsert();
        }
    });
};

// Đặt 1 ảnh làm ảnh chính (cập nhật các ảnh khác về 0)
exports.setMainImage = (imageId, callback) => {
    const iid = Number(imageId);
    if (!iid || iid <= 0) return callback(new Error('Invalid imageId'), null);

    db.query('SELECT tour_id FROM tour_images WHERE image_id = ?', [iid], (findErr, rows) => {
        if (findErr) return callback(findErr, null);
        if (!rows || !rows.length) return callback(null, null);

        const tid = Number(rows[0].tour_id);
        db.beginTransaction((txErr) => {
            if (txErr) return callback(txErr, null);

            db.query('UPDATE tour_images SET is_main = 0 WHERE tour_id = ?', [tid], (upErr) => {
                if (upErr) return db.rollback(() => callback(upErr, null));

                db.query('UPDATE tour_images SET is_main = 1 WHERE image_id = ?', [iid], (up2Err, results) => {
                    if (up2Err) return db.rollback(() => callback(up2Err, null));

                    db.commit((commitErr) => {
                        if (commitErr) return db.rollback(() => callback(commitErr, null));
                        return callback(null, { image_id: iid, tour_id: tid, is_main: 1, affectedRows: results.affectedRows || 0 });
                    });
                });
            });
        });
    });
};

