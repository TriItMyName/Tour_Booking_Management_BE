const Role = require('../models/rolesModel');

// Lấy tất cả roles
exports.getAllRoles = (req, res) => {
    Role.getAllRoles((err, roles) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving roles', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: roles 
        });
    });
};

// Lấy role theo ID
exports.getRoleById = (req, res) => {
    const roleId = req.params.id;
    
    Role.getRoleById(roleId, (err, role) => {
        if (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Role not found', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: role 
        });
    });
};

// Lấy role theo tên
exports.getRoleByName = (req, res) => {
    const roleName = req.params.name;
    
    Role.getRoleByName(roleName, (err, role) => {
        if (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Role not found', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: role 
        });
    });
};

// Tạo role mới
exports.createRole = (req, res) => {
    const { role_name } = req.body;

    if (!role_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'role_name is required' 
        });
    }

    Role.createRole({ role_name }, (err, newRole) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error creating role', 
                error: err.message 
            });
        }
        res.status(201).json({ 
            success: true, 
            message: 'Role created successfully', 
            data: newRole 
        });
    });
};

// Cập nhật role
exports.updateRole = (req, res) => {
    const roleId = req.params.id;
    const { role_name } = req.body;

    if (!role_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'role_name is required' 
        });
    }

    Role.updateRole(roleId, { role_name }, (err, updatedRole) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error updating role', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: 'Role updated successfully', 
            data: updatedRole 
        });
    });
};

// Xóa role
exports.deleteRole = (req, res) => {
    const roleId = req.params.id;
    
    Role.deleteRole(roleId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting role', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    });
};
