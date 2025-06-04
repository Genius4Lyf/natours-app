// The app error is used to catch the errors on the program
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.message = message || 'I fucking hate this';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    //Status could be either be 'fail or error' depending on the status code
    this.isOperationalError = true; //this error class is meant for operational errors

    // capturing the stack trace, which means capturing/showing us where the error happened
    Error.captureStackTrace(this, this.constructor);
    //this way when a new object is created and a contructor function is called, then that fuction call will not appear in the stack trace and will not polute it
  }
}

module.exports = AppError;
