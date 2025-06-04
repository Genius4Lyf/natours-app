/////////////////////////////////// USING EXPRESS FRAMEMWORK IN SERVING STATIC FILE//////////////////////////////////////////
// Defining the core modules
// No core modules needed here

// Defining 3rd party modules/middlware
// Defining express framework into a variable
const express = require('express');
// Defining the morgan module
const morgan = require('morgan');
// Defining the static file
app.use(express.static(`${__dirname}/public`));

//IMPORTING THE ROUTERS
const tourRouter = require('../routes/tourRoutes');
const userRouter = require('../routes/userRoutes');

// Defining the app variable for us to be able to use express
const app = express();

// MIDDLEWAREES
app.use(morgan('dev'));
app.use(express.json());

// CREATING OUR OWN MIDDLEWARE
app.use((req, res, next) => {
  console.log('Hello Motherfuckers, I am the middleware boogieware');
  next();
  // When making our own middleware, we have to call in the next function parameter otherwise the program will stop running and once a response is sent back, that is if a middleware is between a route, it and that route is called upon, the middleware will not get run because a response has ended the program
});

// USING MIDDLEWARE TO SPOT THE TIME THE REQUES HAPPENED
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// MOUNTING THE ROUTERS

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

// EXPORTING THE EXPRESS APP, To be used in the server.js file
module.exports = app;
