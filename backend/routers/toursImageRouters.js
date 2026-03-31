const express = require('express');
const router = express.Router();

const toursImageController = require('../controllers/toursImageController');

router.get('/tour-images', toursImageController.getAllImages);

router.get('/tour-images/tour/:tourId', toursImageController.getImagesByTourId);

router.post('/tour-images', toursImageController.createTourImage);

router.post('/tour-images/tour/:tourId', toursImageController.createTourImagesBulk);

router.get('/tour-images/:id', toursImageController.getImageById);

router.patch('/tour-images/:id/main', toursImageController.setMainImage);

router.delete('/tour-images/:id', toursImageController.deleteTourImage);

module.exports = router;