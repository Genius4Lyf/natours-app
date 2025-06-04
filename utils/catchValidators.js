const AppError = require('./appError');

// This error is used in the tourController to handle errors that is gotten from the async function
module.exports = (err, res) => {
  const { errors } = err;

  const validatorErrors = {};
  let hasValidatorErrors = false;

  // Loop through each property in the error object
  for (const field in errors) {
    // Skip non-object properties or special properties
    if (
      typeof errors[field] !== 'object' ||
      field === 'statusCode' ||
      field === 'status'
    ) {
      continue;
    }

    // Check if the current property is a ValidatorError
    if (errors[field].name === 'ValidatorError') {
      // Add the error message to our result object
      validatorErrors[field] = errors[field].message;
      hasValidatorErrors = true;
    }
  }

  // Create the response message
  let responseMessage = '';

  if (hasValidatorErrors) {
    // Format the validator errors into a readable message
    responseMessage =
      'Validation failed: ' +
      Object.entries(validatorErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join('; ');
  } else {
    // Default error message
    responseMessage = 'An error occurred';
  }

  res.status(400).json({
    status: 'fail',
    message: responseMessage,
    error: err,
  });
  // <--- THIS IS KEY!
  // If fn(...) promise rejects (e.g., with a CastError), .catch(next) is called.
  // This is equivalent to .catch(err => next(err))
};

// while going through the backend course/training, I came across a section where the instructor's code wasn't working properly as to some changes in the error object response. Tried as I must to make this code work to the current error object, with the help of Claude A.I, and my skills in debugging, I was able to get my error handler to work for validation errors
