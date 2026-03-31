const Image = require('../models/toursImageModel');

// Lấy tất cả hình ảnh tour
exports.getAllImages = (req, res) => {
    Image.getAllImages((err, images) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving images',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: images || []
        });
    });
};

// Lấy hình ảnh tour theo ID
exports.getImageById = (req, res) => {
    const imageId = req.params.id;

    Image.getImageById(imageId, (err, image) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving image',
                error: err.message
            });
        }
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }
        return res.status(200).json({
            success: true,
            data: image
        });
    });
};

// Lấy hình ảnh tour theo tour ID
exports.getImagesByTourId = (req, res) => {
    const tourId = req.params.tourId;

    Image.getImagesByTourId(tourId, (err, images) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error retrieving images by tour ID',
                error: err.message
            });
        }
        return res.status(200).json({
            success: true,
            data: images || []
        });
    });
};

// Vì schema không có cột `type`, các API theo type nên trả 400
exports.getImagesByType = (req, res) => {
    return res.status(400).json({
        success: false,
        message: 'Not supported: tour_images table has no column "type". Add column type or remove this endpoint.'
    });
};

exports.getImagesByTourIdAndType = (req, res) => {
    return res.status(400).json({
        success: false,
        message: 'Not supported: tour_images table has no column "type". Add column type or remove this endpoint.'
    });
};

// Thêm 1 ảnh (nếu cần)
exports.createTourImage = (req, res) => {
    const { tour_id, image_url, is_main } = req.body || {};

    Image.createTourImage({ tour_id, image_url, is_main }, (err, created) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error creating tour image',
                error: err.message,
            });
        }
        return res.status(201).json({ success: true, data: created });
    });
};

// Thêm nhiều ảnh cho 1 tour
// Body: { images: [{ image_url: string, is_main?: boolean|0|1 }, ...] }
exports.createTourImagesBulk = (req, res) => {
    const tourId = req.params.tourId;
    const images = req.body?.images;

    Image.createTourImagesBulk(tourId, images, (err, result) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error creating tour images',
                error: err.message,
            });
        }

        return res.status(201).json({
            success: true,
            data: result,
        });
    });
};

// Đặt ảnh chính
exports.setMainImage = (req, res) => {
    const imageId = req.params.id;

    Image.setMainImage(imageId, (err, updated) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error setting main image',
                error: err.message,
            });
        }
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        return res.status(200).json({ success: true, data: updated });
    });
};

// Xóa ảnh
exports.deleteTourImage = (req, res) => {
    const imageId = req.params.id;

    Image.deleteTourImage(imageId, (err, result) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: 'Error deleting tour image',
                error: err.message,
            });
        }
        if (!result) {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        return res.status(200).json({ success: true, data: result });
    });
};
