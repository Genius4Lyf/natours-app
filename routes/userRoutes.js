// DEFINING THE CORE MODULES
// No core modules needed here for now

// 3RD PARTY MODULES
const express = require('express');

// CONTROLLERS
const userController = require('./../controllers/userController');

// AUTHENTICATION CONTROLLER
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

//So as you see, the signup is really kind of a special endpoint. It doesn't fit the REST architecture that we talked about before, because in this case it doesn't make much sense. And so remember how we said that in some special cases, we of course can create other endpoints that do not 100% fit that REST philosophy that is basically implemented here. So this here of course follows 100% the REST philosophy, where the name of the URL has nothing to do with the action that is actually performed.

/////////////////////////////// PASSWORD RESET ROUTE
router.post('/forgotPassword', authController.forgotPassword); // will only recieves the email address

router.patch('/resetPassword/:token', authController.resetPassword); //reset password which will recieve the token as well as the new password

///////////// PROTECTED ROUTES///////////////////////////////
router.use(authController.protect); //this middleware will protect all the routes that comes after it

router.patch('/updateMyPassword', authController.updatePassword); //work for only logged in users, that is why we have to use authController.protect and authController.updatePassword

// ////////////////////////USER UPDATE ROUTE
router.get('/me', userController.getMe, userController.getUser); //this route is used for getting user info

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe,
);
//then again, it is a protected route so only the currently authenticated user can update the data of the current user. And so all of this is of course really secure, again because the ID of the user that is gonna be updated come from request.user, which was set by this protect middleware here, which in turn got the idea from the json web token, and since no one can change the ID in that json web token without knowing the secret, well we know that the ID is then safe because of that. And so because of this, everything here is safe.

// DELETE ME ROUTE
router.delete('/deleteMe', userController.deleteMe);

// FOR ADMIN USAGE
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
