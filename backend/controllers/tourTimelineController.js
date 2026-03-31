const TourTimeline = require('../models/tourTimelineModel');

// Lấy timeline theo tour ID
exports.getTimelineByTourId = (req, res) => {
  const tourId = req.params.tourId;

  TourTimeline.getTimelineByTourId(tourId, (err, timeline) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving timeline',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      data: timeline
    });
  });
};

// Lấy timeline theo ID
exports.getTimelineById = (req, res) => {
  const timelineId = req.params.id;

  TourTimeline.getTimelineById(timelineId, (err, timeline) => {
    if (err) {
      return res.status(404).json({
        success: false,
        message: 'Timeline not found',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      data: timeline
    });
  });
};

// Tạo timeline mới
exports.createTimeline = (req, res) => {
  const { tour_id, day_number, event_time, location, description, is_completed } = req.body;

  if (!tour_id || !day_number || !event_time) {
    return res.status(400).json({
      success: false,
      message: 'tour_id, day_number, and event_time are required'
    });
  }

  const timelineData = {
    tour_id,
    day_number,
    event_time,
    location,
    description,
    is_completed
  };

  TourTimeline.createTimeline(timelineData, (err, newTimeline) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error creating timeline',
        error: err.message
      });
    }
    res.status(201).json({
      success: true,
      message: 'Timeline created successfully',
      data: newTimeline
    });
  });
};

// Cập nhật timeline
exports.updateTimeline = (req, res) => {
  const timelineId = req.params.id;
  const timelineData = req.body;

  TourTimeline.updateTimeline(timelineId, timelineData, (err, updatedTimeline) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error updating timeline',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      message: 'Timeline updated successfully',
      data: updatedTimeline
    });
  });
};

// Xóa timeline
exports.deleteTimeline = (req, res) => {
  const timelineId = req.params.id;

  TourTimeline.deleteTimeline(timelineId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error deleting timeline',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      message: result.message
    });
  });
};

// Đánh dấu timeline đã hoàn thành
exports.markTimelineCompleted = (req, res) => {
  const timelineId = req.params.id;

  TourTimeline.markTimelineCompleted(timelineId, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error marking timeline as completed',
        error: err.message
      });
    }
    res.status(200).json({
      success: true,
      message: result.message
    });
  });
};

/* =========================================================
   ✅ CUSTOMER: Lịch trình theo user (booking APPROVED + tour ONGOING)
========================================================= */
exports.getScheduleByUserId = (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: 'userId is required'
    });
  }

  TourTimeline.getScheduleByUserId(userId, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving schedule',
        error: err.message
      });
    }

    return res.status(200).json({
      success: true,
      data: rows
    });
  });
};

/* =========================================================
   ✅ GUIDE: Lịch trình theo guide_id (tour_assignments)
========================================================= */
exports.getScheduleByGuideId = (req, res) => {
  const guideId = req.params.guideId;

  if (!guideId) {
    return res.status(400).json({
      success: false,
      message: 'guideId is required'
    });
  }

  TourTimeline.getScheduleByGuideId(guideId, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error retrieving guide schedule',
        error: err.message
      });
    }

    return res.status(200).json({
      success: true,
      data: rows
    });
  });
};
