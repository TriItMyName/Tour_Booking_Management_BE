const Region = require('../models/regionsModel');

// Lấy tất cả regions
exports.getAllRegions = (req, res) => {
    Region.getAllRegions((err, regions) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error retrieving regions', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: regions 
        });
    });
};

// Lấy region theo ID
exports.getRegionById = (req, res) => {
    const regionId = req.params.id;
    
    Region.getRegionById(regionId, (err, region) => {
        if (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Region not found', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: region 
        });
    });
};

// Lấy region theo tên
exports.getRegionByName = (req, res) => {
    const regionName = req.params.name;
    
    Region.getRegionByName(regionName, (err, region) => {
        if (err) {
            return res.status(404).json({ 
                success: false, 
                message: 'Region not found', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            data: region 
        });
    });
};

// Tạo region mới
exports.createRegion = (req, res) => {
    const { region_name } = req.body;

    if (!region_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'region_name is required' 
        });
    }

    Region.createRegion({ region_name }, (err, newRegion) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error creating region', 
                error: err.message 
            });
        }
        res.status(201).json({ 
            success: true, 
            message: 'Region created successfully', 
            data: newRegion 
        });
    });
};

// Cập nhật region
exports.updateRegion = (req, res) => {
    const regionId = req.params.id;
    const { region_name } = req.body;

    if (!region_name) {
        return res.status(400).json({ 
            success: false, 
            message: 'region_name is required' 
        });
    }

    Region.updateRegion(regionId, { region_name }, (err, updatedRegion) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error updating region', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: 'Region updated successfully', 
            data: updatedRegion 
        });
    });
};

// Xóa region
exports.deleteRegion = (req, res) => {
    const regionId = req.params.id;
    
    Region.deleteRegion(regionId, (err, result) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting region', 
                error: err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: result.message 
        });
    });
};
