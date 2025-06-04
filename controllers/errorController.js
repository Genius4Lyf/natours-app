// This controller function is used by the app.use at app.js file to handle errors
const AppError = require('./../utils/appError');

// This code is meant to handle cast error coming from the getTours controller when the findById is ran
const handleCastErrorDB = (err) => {
  console.log('Error log from handleCastError', err);
  const message = `No tour found with that ID: ${err.path}: ${err.value}.`;
  return new AppError(message, 400); // 404 for Bad Request
};

const handleDuplicateFieldDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value} Please use another value`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  console.log(err);
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input Data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (error) => {
  return new AppError('Invalid Token, please loggin again', 401);
};

const handleJWTExpiredError = (error) => {
  return new AppError('Your token has Expired, please loggin again', 401);
};

const sendErrorDev = (err, req, res) => {
  let error = { ...err, message: err.message, name: err.name }; // Ensure all relevant properties are copied
  if (req.originalUrl.startsWith('/api')) {
    if (error.name === 'CastError') error = handleCastErrorDB(err);

    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: error,
      stack: error.stack,
      // For development, you might want to send the stack:
      // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  } else {
    // RENDERED WEBSITE
    res.status(error.statusCode).render('error', {
      title: 'Something went wrong',
      msg: error.message,
    });
  }
};

const sendErrorProd = (err, req, res) => {
  // Operational, tustred error: send message to client
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperationalError) {
      res.status(err.statusCode).json({
        devEnvironment: 'Production',
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack,
        // For development, you might want to send the stack:
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
      // Programming or other unknown error: don't leak details to the client
    } else {
      // 1) Log error to console
      console.error('Error💥💥', err);

      // 2) Send generic message
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
        error: err,
      });
    }
  } else {
    res.status(err.statusCode);
  }
};

///////////////////////////////////////////////////////////////

module.exports = (err, req, res, next) => {
  // (err, req, res, next) by specifying four parameters, Express automatically knows that this entire function here is an error handling middleware.
  err.statusCode = err.statusCode || 500; //which mean internal server error
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    if (err.code === 11000) err = handleDuplicateFieldDB(err);

    if (err.code === 'ValidationError') err = handleValidationErrorDB(err);

    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);

    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError(err);

    sendErrorProd(err, req, res);
  } else if (process.env.NODE_ENV === 'development') {
    console.log(err);
    sendErrorDev(err, req, res);
  }
};
