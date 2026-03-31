const db = require('../config/db');

// Lấy tất cả regions
exports.getAllRegions = (callback) => {
    db.query('SELECT * FROM regions', (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Lấy region theo ID
exports.getRegionById = (regionId, callback) => {
    db.query('SELECT * FROM regions WHERE region_id = ?', [regionId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('Region not found'), null);
        }
        callback(null, results[0]);
    });
};

// Lấy region theo tên
exports.getRegionByName = (regionName, callback) => {
    db.query('SELECT * FROM regions WHERE region_name = ?', [regionName], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('Region not found'), null);
        }
        callback(null, results[0]);
    });
};

// Tạo region mới
exports.createRegion = (regionData, callback) => {
    const { region_name } = regionData;

    if (!region_name) {
        return callback(new Error('Region name is required'), null);
    }

    db.query(
        'INSERT INTO regions (region_name) VALUES (?)',
        [region_name],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { 
                region_id: results.insertId, 
                region_name 
            });
        }
    );
};

// Cập nhật region
exports.updateRegion = (regionId, regionData, callback) => {
    const { region_name } = regionData;

    if (!region_name) {
        return callback(new Error('Region name is required'), null);
    }

    db.query(
        'UPDATE regions SET region_name = ? WHERE region_id = ?',
        [region_name, regionId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { region_id: regionId, region_name });
        }
    );
};

// Xóa region
exports.deleteRegion = (regionId, callback) => {
    db.query('DELETE FROM regions WHERE region_id = ?', [regionId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'Region deleted successfully' });
    });
};
