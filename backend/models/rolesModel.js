const db = require('../config/db');

// Lấy tất cả roles
exports.getAllRoles = (callback) => {
    db.query('SELECT * FROM roles', (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, results);
    });
};

// Lấy role theo ID
exports.getRoleById = (roleId, callback) => {
    db.query('SELECT * FROM roles WHERE role_id = ?', [roleId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('Role not found'), null);
        }
        callback(null, results[0]);
    });
};

// Lấy role theo tên
exports.getRoleByName = (roleName, callback) => {
    db.query('SELECT * FROM roles WHERE role_name = ?', [roleName], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        if (results.length === 0) {
            return callback(new Error('Role not found'), null);
        }
        callback(null, results[0]);
    });
};

// Tạo role mới
exports.createRole = (roleData, callback) => {
    const { role_name } = roleData;

    if (!role_name) {
        return callback(new Error('Role name is required'), null);
    }

    db.query(
        'INSERT INTO roles (role_name) VALUES (?)',
        [role_name],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { 
                role_id: results.insertId, 
                role_name 
            });
        }
    );
};

// Cập nhật role
exports.updateRole = (roleId, roleData, callback) => {
    const { role_name } = roleData;

    if (!role_name) {
        return callback(new Error('Role name is required'), null);
    }

    db.query(
        'UPDATE roles SET role_name = ? WHERE role_id = ?',
        [role_name, roleId],
        (err, results) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, { role_id: roleId, role_name });
        }
    );
};

// Xóa role
exports.deleteRole = (roleId, callback) => {
    db.query('DELETE FROM roles WHERE role_id = ?', [roleId], (err, results) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, { message: 'Role deleted successfully' });
    });
};
