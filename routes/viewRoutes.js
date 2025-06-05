const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');
const bookingController = require('./../controllers/bookingController');

const router = express.Router();

// HTML ROUTERS
// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     // locals in the pug file
//     tour: 'The Forest Hiker',
//     user: 'Jonas',
//   });
// }); //route which we used in rendering our base template

router.get(
  '/',
  // bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview,
); //adding the booking controller for creating booking chekcout is temporary until the app will be deployed into a server then a good solution will be made for this
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/me', authController.protect, viewController.getAccount);
router.get('/my-tours', authController.protect, viewController.getMyTours);

// HANDLIND FORM FROM THE CLIENT SIDE
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData,
);

module.exports = router;
