const express = require('express');
const tourTimelineController = require('../controllers/tourTimelineController');

const router = express.Router();

// ✅ CUSTOMER schedule
router.get('/tour-timeline/schedule/user/:userId', tourTimelineController.getScheduleByUserId);

// ✅ GUIDE schedule
router.get('/tour-timeline/schedule/guide/:guideId', tourTimelineController.getScheduleByGuideId);

// Timeline theo tour
router.get('/tour-timeline/tour/:tourId', tourTimelineController.getTimelineByTourId);

// Timeline theo id
router.get('/tour-timeline/:id', tourTimelineController.getTimelineById);

// Tạo timeline
router.post('/tour-timeline', tourTimelineController.createTimeline);

// Cập nhật timeline
router.patch('/tour-timeline/:id', tourTimelineController.updateTimeline);

// Xóa timeline
router.delete('/tour-timeline/:id', tourTimelineController.deleteTimeline);

// Đánh dấu hoàn thành
router.patch('/tour-timeline/:id/completed', tourTimelineController.markTimelineCompleted);

module.exports = router;
