// This error is used in the tourController to handle errors that is gotten from the async function
module.exports = (fn) => {
  // fn is your async (req, res, next) => { ... } controller
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err)); // <--- THIS IS KEY!
    // If fn(...) promise rejects (e.g., with a CastError), .catch(next) is called.
    // This is equivalent to .catch(err => next(err))
  };
};
