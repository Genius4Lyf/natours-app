const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const catchValidators = require('./../utils/catchValidators');
const APIfeatures = require('./../utils/apiFeatures');

// HANDLER FACTORY FOR ALL CONTROLLERS
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour(hack)
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    // EXECUTE QUERY
    // const tours = await query; //when the queries are use in the getAllTours function

    const features = new APIfeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const document = await features.query;
    // Recap: We are creating a new object of the APIfeatures class, in there, we are passing a query object and the query string that's coming from express
    //const features = new APIfeatures(query object, query string).
    // And then in each of the four methods that was added, we basically manipulated the query, and then we simply await the result of all the query with all the documents that was selected and that query now leaves at
    // features.query()

    // examples
    // a. const filteredTours = await Tour.find({
    // duration: 5,
    // difficulty: 'easy'
    // })
    // ///////////OR
    // b. const filteredTours = await Tour.find()
    //   .where('duration')
    //   .equals(5)
    //   .where('difficulty')
    //   .equals('easy');
    //   .sort("price")

    // RESPONSE SENT TO CLIENT
    res.status(200).json({
      status: 'success',
      results: document.length,
      requestedAt: req.requestTime,
      data: {
        data: document,
      },
    });
    //   res.send('Hello World!');
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const document = await query;

    // READING DOCUMENTS FROM OUR DATABASE
    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    // RESPONSE SENT TO CLIENT
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: document.length,
      data: {
        data: document,
      },
    });
    //   res.send('Hello World!');
  });

exports.createOne = (Model) => async (req, res, next) => {
  let response = res;
  try {
    const document = await Model.create(req.body); //We use the Tour model directly and call the create method on it and into that function, we pass the data that we want to store in the database as a new tour and that data come from the post body (req.body)
    res.status(201).json({
      status: 'succes',
      data: {
        data: document,
      },
    });
  } catch (err) {
    console.log(err);
    catchValidators(err, response);
  }
};

exports.updateOne = (Model) => async (req, res, next) => {
  let response = res;
  try {
    // READING DOCUMENTS FROM OUR DATABASE
    // const tour = await Tour.findByIdAndUpdate(req.params.id, the new update, {config});
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // RESPONSE SENT TO CLIENT
    response.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: Model.length,
      data: {
        data: document,
      },
    });
  } catch (err) {
    console.log(err);
    catchValidators(err, response);
  }
};

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      // data: {
      //   tour: null,
      // },
    });
  });

// STATUS CODE
// 200 = OK
// 201 = CREATED
// 204 = NO CONTENT
// 500 = error
