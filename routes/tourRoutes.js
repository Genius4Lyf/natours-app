// DEFINING THE CORE MODULES
// No core modules defined here

// 3RD PARTY MODULES
const express = require('express');

// CONTROLLERS
const tourController = require('./../controllers/tourController');
const authController = require('./../controllers/authController');
const reviewRouter = require('./../routes/reviewRoutes');

// MIDDLEWARE
const router = express.Router();

// NESTED ROUTES
// POST /tour/233435j/reviews
// GET /tour/233435j/revies
// GET /tour/233435j/revies/i9047544

router.use('/:tourId/reviews', reviewRouter); //use review router for this router, the review router doesn't automatically get the id of the tour router and so, we have to implement it on the reviewRouter

// ROUTERS

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );
router.route('/tours-stats').get(tourController.getTourStats);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// instead we could do it like this
// tours-distance?distance=233&center=-40,45&unitmi
// OR
// tours-distance/233/center/-40,45/unit/mi

router.route('/').get(tourController.getAllTours);

router
  .route('/')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );
//authcontroller.protect will run first and if the user is not authenticated, it will protect the axis to the creteTour request and authcontroller.restrictTo will permit only admins to createTour

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour,
  );

module.exports = router;

// WHY DO WE RUN MULTPLE MIDDLEWARE FUNCTION
//Just incase we want to check the data that is comming into the body i.e if request.body actually contains the body we want for the tour
