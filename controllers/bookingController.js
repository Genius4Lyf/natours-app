const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //this will exposed a function and usually what we do is to pass our secret key into into which we give us an obect
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');
const User = require('../models/userModel');
// const AppError = require('./../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1. Get the current booked tour
  const tour = await Tour.findById(req.params.tourId);
  // 2. Create checkout session
  // CHECKOUT REQUEST
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], //card is for card payment
    mode: 'payment',
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, //url that will get called as soon as the payment is successful
    success_url: `${req.protocol}://${req.get('host')}/my-tours`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, //url that will be called when they cancel the payment
    customer_email: req.user.email,
    client_reference_id: req.params.tourId, //To pass in some data about the session we are currently creating And that's important because lateronce the purchase was successful,we will then get access to the session object again.And by then, we want to create a new bookingin our database.

    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, //multiply by 100 cause the amount is expected to be in cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            ],
          },
        },
        quantity: 1,
      },
    ],
  });
  // 3. Create session as respons
  res.status(200).json({
    status: 'success',
    session,
  });
});

// CREATE BOOKING CHECKOUT
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY Cause everyone can book a tour without paying for it
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();

//   await Booking.create({ tour, user, price });

//   // for security reasons, we should not use the url with the request params to load our overview page
//   res.redirect(req.originalUrl.split('?')[0]);
//   if (process.env.NODE_ENV) {
//     console.log('Booking has been created');
//   }

//   // redirect creates a new request to the new url we passed
// }); ======> NOT NEEDED AFTER HOSTING THE WEB SERVICE ONLINE, USE WEBHOOKCHECKOUT INSTEAD BELOW

const createBookingCheckout = async (session) => {
  const tour = client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    // create a stripe event
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    ); //remember body has to be in a raw format
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    createBookingCheckout(event.data.object);
  }

  res.status(200).json({ recieved: true });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
