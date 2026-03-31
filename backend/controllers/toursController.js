const Tour = require('../models/toursModel');

// Lấy tất cả tours
exports.getAllTours = (req, res) => {
  Tour.getAllTours((err, tours) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving tours',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      data: tours
    });
  });
};

// Lấy tour theo ID
exports.getTourById = (req, res) => {
  const tourId = req.params.id;

  Tour.getTourById(tourId, (err, tour) => {
    if (err) {
      return res.status(404).json({
        success: false,
        message: 'Tour not found',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      data: tour
    });
  });
};

// Lấy tours theo region
exports.getToursByRegion = (req, res) => {
  const regionId = req.params.regionId;

  Tour.getToursByRegion(regionId, (err, tours) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving tours by region',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      data: tours
    });
  });
};

// Lấy tours theo status
exports.getToursByStatus = (req, res) => {
  const status = req.params.status;

  Tour.getToursByStatus(status, (err, tours) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving tours by status',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      data: tours
    });
  });
};

// Tạo tour mới
exports.createTour = (req, res) => {
  const { tour_name, description, start_date, end_date, max_participants, status, region_id } = req.body;

  if (!tour_name || !start_date || !end_date || !max_participants || !region_id) {
    return res.status(400).json({
      success: false,
      message: 'tour_name, start_date, end_date, max_participants, and region_id are required'
    });
  }

  const tourData = { tour_name, description, start_date, end_date, max_participants, status, region_id };

  Tour.createTour(tourData, (err, newTour) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error creating tour',
        error: err.message
      });
    }
    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      data: newTour
    });
  });
};

// Cập nhật tour
exports.updateTour = (req, res) => {
  const tourId = req.params.id;
  const tourData = req.body;

  Tour.updateTour(tourId, tourData, (err, updatedTour) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error updating tour',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      message: 'Tour updated successfully',
      data: updatedTour
    });
  });
};

// Xóa tour
exports.deleteTour = (req, res) => {
  const tourId = req.params.id;

  Tour.deleteTour(tourId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting tour',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      message: result.message
    });
  });
};

// GUIDE xác nhận hoàn thành: ONGOING -> FINISHED (chỉ guide được assign mới làm được)
exports.finishTour = (req, res) => {
  const tourId = Number(req.params.id);
  const guideId = Number(req.body?.guide_id || 0);

  if (!tourId) {
    return res.status(400).json({
      success: false,
      message: 'tourId is required'
    });
  }

  if (!guideId) {
    return res.status(400).json({
      success: false,
      message: 'guide_id is required'
    });
  }

  Tour.finishTour(tourId, guideId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error finishing tour',
        error: err.message
      });
    }

    if (!result || result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        message: 'Only assigned guide can finish, and tour must be ONGOING'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Tour finished successfully',
      data: { tour_id: tourId, status: 'FINISHED' }
    });
  });
};

// Cập nhật status tour (admin/office dùng) - chặn FINISHED qua endpoint này
exports.updateTourStatus = (req, res) => {
  const tourId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: 'status is required'
    });
  }

  if (String(status).toUpperCase() === 'FINISHED') {
    return res.status(400).json({
      success: false,
      message: 'Use PATCH /tours/:id/finish to set FINISHED'
    });
  }

  Tour.updateTourStatus(tourId, status, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error updating tour status',
        error: err.message
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Tour status updated successfully',
      data: result
    });
  });
};
