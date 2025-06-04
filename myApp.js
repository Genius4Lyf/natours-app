/////////////////////////////////// USING EXPRESS FRAMEMWORK//////////////////////////////////////////
// Defining the core modules
const path = require('path'); //research what this built model(path) does later on

// Defining 3rd party modules/middlware
// Defining express framework into a variable
const express = require('express');
// Defining the morgan module
const morgan = require('morgan');

// SECURITY MIDDLEWARES
// Defining express-rate-limiter
const rateLimit = require('express-rate-limit');

// Defining the helmet package
const helmet = require('helmet');

// Defining the Sanitizers
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

//Defining the hpp package
const hpp = require('hpp');

// Defining the cookie parser
const cookieParser = require('cookie-parser');

// IMPORTING THE ERROR HANDLER APPERROR
const globalErrorHandler = require('./controllers/errorController');

//IMPORTING THE ROUTERS
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

// Defining the app variable for us to be able to use express
const app = express();

// PUG (TEMPLATE ENGINE)
app.set('view engine', 'pug'); //no packages needs to be installed and we don't have to require the pug into the app.js folder
app.set('views', path.join(__dirname, 'views')); //use for defining which folder our views template is located at

// JSON MIDDLEWARE FOR STATIC PAGES
app.use(express.static(path.join(__dirname, 'public'))); //This line tells your Express application: "Hey, if you receive a request for a file (like an image, CSS file, or a client-side JavaScript file), try to find it inside the public folder located in the same directory as app.js. If you find it, send it directly to the browser."`

// GLOBAL MIDDLEWAREES
// Middlewares are executed in the order they are in the code

// HELMET MIDDLEWARE - Configure CSP
// Set Security HTTP headers
// app.use(helmet()); // Replace this with specific configuration

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'], // Allow scripts from unpkg and jsdelivr
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // Allow styles from self, https, and inline styles (often needed for Leaflet)
      workerSrc: ["'self'", 'data:', 'blob:'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: [
        "'self'",
        'data:',
        'blob:',
        'https://tile.openstreetmap.org',
        'https://unpkg.com',
      ], // Allow images (tiles) from OpenStreetMap and icons from unpkg
      formAction: ["'self'"],
      connectSrc: ["'self'", 'https://tile.openstreetmap.org'], // Allow connections to OpenStreetMap tile server
      upgradeInsecureRequests: [],
    },
  }),
);

// MORGAN MIDDLEWARE
// for the morgan middleware to work/logged into the console only when we are in develoment
//DEVELOPMENT MIDDLEWARE
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// EXPRESS-LIMIT-MIDDLEWARE
// Limiter: Recieves an object of limiter, used for limiting the number of request sent to this server
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, //windowMs: window milliseconds
  message: 'Too many requests from that this IP, please try again in an hour',
});
app.use('/api', limiter); //this will affect all the routes withl '/api/

// JSON MIDDLEWARE FROM EXPRESS (BODY PARSER, READING DATA FROM THE BODY)
app.use(
  express.json({
    limit: '10kb', //when we have a body a body larger than 10kb, then it will not be accepted
  }),
); //When your server receives a request (like a POST or PUT request) where the client is sending data in JSON format (and the Content-Type header is set to application/json), this middleware steps in. It takes the raw JSON data from the request's body. It then parses this JSON data into a JavaScript object.Finally, it makes this JavaScript object available in your route handlers under req.body

app.use(cookieParser()); //parses the data from cookie

// DATA  SANITIZATION
// Data sanitization basically means to clean all the data that comes into the application from malicious code. So, code that is trying to attack our application. In this case, we're trying to defend against two attacks.

// i. Data Sanitization  against NoSQL query injection
app.use(mongoSanitize());
//So, what this middleware does is to look at the request body, the request query string, and also at Request.Params, and then it will basically filter out all of the dollar signs and dots, because that's how MongoDB operators are written. e. $

// ii. Data Sanitization  against NoSQL query injection
app.use(xss());
// This will then clean any user input from malicious HTML code, basically. Imagine that an attacker would try to insert some malicious HTML code with some JavaScript code attached to it. If that would then later be injected into our HTML site, it could really create some damage then. Using this middleware, we prevent that basically by converting all these HTML symbols. As I said before, the Mongoose validation itself is actually already a very good protection against XSS, because it won't really allow any crazy stuff to go into our database, as long as we use it correctly. Whenever you can, just add some validation to your Mongoose schemas, and that should mostly protect you you from cross-site scripting, at least on the server side.

// PREVENTING PARAMETER POLUTION
app.use(
  hpp({
    // the whitelist is simply an array of properties which we actually duplicates in the query string
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// CREATING OUR OWN MIDDLEWARE
// When making our own middleware, we have to call in the next function parameter otherwise the program will stop running and once a response is sent back, that is if a middleware is between a route, it and that route is called upon, the middleware will not get run because a response has ended the program
// JUST FOR EXPLANATION
// app.use((req, res, next) => {
//   console.log('Hello Leinad, I am the example for app.use() case');
//   next();

// });

// USING MIDDLEWARE TO SPOT THE TIME THE REQUES HAPPENED
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES
// MOUNTING ROUTES FOR RENDERING
app.use('/', viewRouter);

// MOUNTING THE ROUTERS FOR DATA BASE MANAGEMNET
// Mouting the routers on the path at which the a url request is called upon
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
// And so again this router here that we're specifying now is basically a middleware that we mount upon this path. Okay? So whenever there is a request with a url that starts like this then this middleware function here will basically be called. And so that is then our router and in there just the slash route, so just the root basically will then be this API V1

/////////////////////////////////////////////////////////////
// This middlewares will get run when it was not able to be handled by the route handlers middleware

// HANDLING UNKNOWN ROUTES
app.all('*', (req, res, next) => {
  // old method of handling the error
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server`,
  });
  // old method of handling the error
  // const err = new AppError(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  // Using the imported AppErro class to handle the error
  // next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));

  //So again, whenever we pass anything into next,  it will assume that it is an error, and it will then skip all the other middlewares in the middleware stack and sent the error that we passed in to our global error handling middleware, which will then, of course, be executed.
}); //Why did this work?
// So again the idea is that if we are able to reach this point here then it means that the request response cycle was not yet finished at this point in our code, right.Because remember that middleware is added to the middleware stack in the order that it's defined here in our code.And so basically this code here runs first,and so if the route was matched here in our tourRouter then our request would never even reach this code

// ERROR HANDLING MIDDLEWARE
// In express comes with middleware handlers out of the box So, to define an error handling middleware, all we need to do is to give the middleware function four arguments and Express will then automatically recognize it as an error handling middleware. And therefore, only call it when there is an error. And so just like in many other cases, this middleware function is an error first function,
// app.use((err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error'

//   res.status(err.statusCode).json({
//     status: err.status,
//     message: err.message
//   })
// }) Later placed in the errorController.js file
app.use(globalErrorHandler);

// EXPORTING THE EXPRESS APP, To be used in the server.js file
module.exports = app;

// STATUS CODE
// 200 = OK
// 201 = CREATED
// 204 = NO CONTENT
// 500 = Internal server error
