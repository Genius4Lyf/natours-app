const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1. Get all the tour data from our collection
  const tours = await Tour.find();
  // 2. Build Template

  // 3. Render the template using the data from tour 1
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

exports.getTour = async (req, res, next) => {
  let tour;
  try {
    // 1. Get the data, for the request
    tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });
    // 2. Build the template
    //   done on the pug file
  } catch (err) {
    return next(err);
  }

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  // 3. Render template using the data from the tour
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
};

exports.getLoginForm = (req, res) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  });
};

// Here we don't need to pass in the user because the authController.protect middleware will do that when it runs
exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1.Find all bookings
  //we could also do a virtual populate with the tours and we can do it manually
  const bookings = await Booking.find({ user: req.user.id });

  // 2.Find tours with the retured IDs
  const tourIDs = bookings.map((el) => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //{ $in: tourIDs } this will select all the tours which have an id which is in the tourID array

  res.status(200).render('overview', {
    title: 'My tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    // it's a good practice to tell the data base that this is a new document everytime we update a field and should run validators again so that hackers do not send malicious code into the database
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
});
