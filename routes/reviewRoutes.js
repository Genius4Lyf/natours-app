const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true }); //why do we need mergeParams set to true? Well, it's because, by default, each router only have access to the parameters of their specific routes, right. But here, in this route, so in this URL for this post, there's of course actually no tour id. But, we still want to get access to the tour id that was in this other router, right. So this here. And so, in order to get access to that parameter in this other router, we need to physically merge the parameters, okay. And so that's what mergeParams, set to true, does.
// POST /tour/23r4332/reviews => so no matter if you get a route like this, it will all end up in this review route

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );

module.exports = router;
