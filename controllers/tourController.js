// Defining personal modules
const Tour = require('../models/tourModel'); //Gotten from the tour model so we can use it for querrying, creating, deleting and updating the tour
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./handlerFactory');

// Defining Multer USED FOR FILE UPLOADS
const multer = require('multer'); // after defining multer, we nned to config multer upload
const sharp = require('sharp'); //used for image processing

const multerStorage = multer.memoryStorage(); //the image will be then be stored as a buffer and then that buffer is then available in req.file.buffer

const multiFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image!, please upload only images'), false);
  }
}; //the goal is basically to test if the uploaded file is an image. And if it is so, then we pass true into the callback function, and if it's not we pass false into the callback function, along with an error. Because again, we do not want to allow files to be uploaded that are not images. And so that's exactly what this filter is for. Now, if in your own application you want to upload something else, let's say CSV files, when then of course you can test for that instead of images. So all the stuff that we're doing here works not only for images, but really for all kinds of files that you want to upload

const upload = multer({
  storage: multerStorage,
  fileFilter: multiFilter,
}); //saves the uploaded file to a directory in our file system.
//NOTE: images are not directly uploaded into the database, we just upload them into our file system and then in the database we put a link basically to that image. So in this case in each user document we will have to name all of the uploaded file

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]); //when there is a mix of fields then its' upload.field([])

// when it's single(one field), it's upload.single('fieldname'), this will produce req.file
// when it's an array of images and one field upload, it's upload.array('images', 5) this will produce req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // console.log(req.files)
  if (!req.files.imageCover || !req.files.images) return next();

  // 1. COVER IMAGE
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.file.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.body.imageCover}`);

  // 2.IMAGES
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${filename}`);

      req.body.images.push(filename);
    }),
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
}; //This function(middleware) prefills the query object when it is called upon by the route('/top-5-cheap) and then calls the function with the next method when it is done

// IMPLEMENTING THE AGGREGATION PIPELINE
// 1.Getting Tour Statistics (Matching and Grouping)
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      // each of the stages is an object property
      $match: { ratingsAverage: { $gte: 4.5 } }, // Selecting a document which have a ratingsAverage greater than or equal to 4.5
    },
    {
      // As the name says, it allows us to group documents together, basically using accumulators
      $group: {
        _id: null, //By calling out an _id specifies what we want to group by, and setting it to null will make us have everything in one group
        // _id: '$difficulty', // or we can get stats on difficulty
        //_id: '$ratingsAverage' // or we can get stats on ratingsAverage
        //   _id: {$toUpper: '$ratingsAverage' } // transform the id value to uppercase
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratinsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $avg: '$price' },
        maxPrice: { $avg: '$price' },
        //In order to specify the field which we want to calculate the average from, we need to use the dollar sign $ and the name of the field in quotes '$ratingsAverag'
      },

      $sort: { avgPrice: 1 }, //Sorts the document according to the average price, setting the value to 1 for ascending
    },
  ]); //Using the aggreation pipeline is a bit like doing a query, the difference is that in aggregation, we can manipulate the data in a couple of different stepes, for that we pass in array of stages, the documents then pass through this stages one by one, step by step in the define sequence. Check the mongo db documentation for reference https://www.mongodb.com/docs/manual/reference/operator/aggregation-pipeline/

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// 2.
// Solving a real world business problem. Lets say your business owner ask us to implement a function calculate the busiess month of a given year
// By Calculating how many tours start in each of the month in a given year

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  console.log('PARAMS:', req.params);
  const year = req.params.year * 1; //

  const plan = await Tour.aggregate([
    {
      // $unwind decontructs an array field from the documents and then output one document for each element of the array, i.e we want to have one tour for each of these dates in the array and the field we want to unwind is the start dates
      $unwind: '$startDates',
    },

    {
      // Convert the startDates string to a BSON Date object
      // Add a new field, e.g., 'startDateConverted', to hold the Date object
      $addFields: {
        startDateConverted: { $toDate: '$startDates' },
      },
      //The Solution ($toDate): The fix involved using the $toDate aggregation operator. This operator explicitly told MongoDB: "Take the value in the startDates field (which is a string), parse it, and convert it into an actual BSON Date object within the database during the aggregation." Once converted to a BSON Date (in the startDateConverted field), the comparison using $gte and $lte against other BSON Dates worked correctly because you were comparing the same data types (numeric milliseconds since the epoch).
    },

    {
      // Now match using the newly created Date field
      $match: {
        startDateConverted: {
          // Use the converted date field
          // Use explicit UTC dates for reliable comparison boundaries
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lte: new Date(`${year}-12-31T23:59:59.999Z`),
        },
      },
    },

    {
      // Group by month to get the count per month (Fulfills the original business requirement)
      $group: {
        _id: { $month: '$startDateConverted' }, // Group by the month number (1-12)
        numTourStarts: { $sum: 1 }, // Count how many tours start in this month
        tours: { $push: '$name' }, // Optional: list the names of tours starting in that month
      },
    },

    {
      // Add a field to make the month number more readable
      $addFields: { month: '$_id' },
    },

    {
      // Remove the original _id field (optional)
      $project: {
        _id: 0, // 0 means do not include this field // means that the id will no longer show up at the output data, if you put 1, then it will show up
      },
    },

    {
      // Sort the results by month number
      $sort: { numTourStarts: -1 }, // Sort descending by month
    },

    {
      $limit: 12,
    },

    //   {
    // this will output tours that are provided into the year param
    //     $match: {
    //       startDates: {
    //         $lte: new Date(`${year}-12-31`),
    //         $gte: new Date(`${year}-01-01`),
    //       },
    //     },
    //   },
  ]);

  res.status(200).json({
    status: 'success',
    results: plan.length,
    data: {
      plan,
    },
  });
});

// '/tours-within/:distance/center/:latlng/unit/:unit',
// '/tours-within/:distance/center/34.111745, -118.113491/unit/:unit',

// GEOSPATIAL FUNCTION
// USING GEO DATA TO SEARCH FOR TOUR DOCUMENTS WITHIN A CERTAIN DISTANCE FROM A CERTAIN POINT USING GEO QUERIES
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latittude and longitude in the format lat,lng',
      ),
    );
  }

  // we want to query for start location, because the start location field is what holds the geoSpatial point where each tour starts... explanation of this is down below
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  // multiplier incase the unit is mi = 0.000621371 and incase it is meters multiplier = 0.001
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    return next(
      new AppError(
        'Please provide latittude and longitude in the format lat,lng',
      ),
    );
  }

  // IN OTHER TO DO CALCULATION ON THE DATABASE, WE ALWAYS USE the aggregate pipeline
  const distances = await Tour.aggregate([
    //so remember we always pass in an array with all the stages of the aggregation pipeline we want to define
    {
      //  this is the only geospatialaggregation pipeline stage that actually exists.This one always needs to be the first one in the pipeline.So keep that in mind that geoNearalways needs to be the first stage.
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1], //multiply both by 1 to convert to numbers
        },
        distanceField: 'distance', //this is the field that will be created and where all the calculated distance will be stored
        distanceMultiplier: multiplier, // the number will be used for multiplying all the distance in ordet to convert it to kilometer
      },
      //Something else that's also very important to note about geoNear is that it requires that at least one of our fields contains a geospatial index. Actually we already did that before, so let's again take a look(inside tourModel). Our start location already has this 2dsphere geospatial index on it. Since we're using this startLocation in order to calculate the distances, well, that's then perfect. If there's only one field with a geospatial index then this geoNear stage here will automatically use that index in order to perform the calculation. But if you have multiple fields with geospatial indexes then you need to use the keys parameter in order to define the field that you want to use for calculations. So keep that in mind, but again, in this case we only have one field, and so automatically that startLocation field is going to be used for doing these calculations. So, what do we need to pass into geoNear
    },
    {
      // with this we get only the distance and the tour name when projecting the data in our response
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

//FACTORY HANDLERS FOR TOUR
exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// USING GEOSPATIAL IN MONGOOSE
// And so that's exactly what we're searching for. So, start location, and now we need to specify the value that we're searching for. And for that, we will now use a geospatial operator called geo within. As always, we need to specify the subject, and then here, where we would earlier use like some math operator like greater than, this time we use a geospatial operator like this one. Geo within, and this operator does exactly what it says. Basically it finds documents within a certain geometry. And that geometry is what we need to define as a next step. So we want to find documents, but where do we actually want to find these documents? Well we want to find them inside of a sphere that starts at this point that we defined, and which has a radius of the distance that we defined. So again with our example in Los Angeles, if you specify the distance of 250 miles, then that means you want to find all the tour documents within a sphere that has a radius of 250 miles. Okay, make sense? And so now we need to pass the information here into the geo within operator, okay? And we do that by defining a center sphere. Okay, and again, I know that this looks quite confusing, but that's why I'm explaining it here step by step. And also in a second, we're going to take a look at the documentation. So the center sphere operator takes an array of the coordinates and of the radius. And let's actually format the code here to at least make it look a bit easier, okay? Well it kind of looks the same, but anyway, that's how you find the coordinates here. And for that, we need yet another array, and then the longitude and the latitude. And that's right. You first need to always define the longitude and then the latitude, which is a bit counterintuitive because usually coordinate pairs are always specified with the latitude first, and the longitude first. I think I mentioned it before that in geo adjacent, it for some reason works like this. So that is the center of the sphere. Now we need to specify it's radius. Now here we actually do not pass in the distance, but instead it expects a radius in a special unit called radians. So let me put radius variable here, and then in a second we are going to define it. So let's now actually define the radius. So again, the radius is basically the distance that we want to have as the radius, but converted to a special unit called radians. And in order to get the radians, we need to divide our distance by the radius of the earth. So that sounds a bit crazy but really this is how it works. Okay, so now we actually need to take into consideration our units here, because of course the radius of the earth is different in miles then in kilometers. So let's now do a turnery of greater here and say that if the unit is equal to miles, well then the result here should be distance. So basically our original radius divided by 3963.2. Okay, so again, that is the radius of the Earth in miles. Okay, and otherwise, we will then assume that it's kilometer. And so if it is kilometers, then it is the distance divided by 6,378.1 kilometers. All right, so again, this kind of crazy conversion here is necessary because normally it would expect the radius of our sphere to be in radians. And radians we get by dividing the distance by the radius of the Earth. Great, so we're almost ready to test this now. Let's just add the results property that we used to have. So with the number of results basically, and then another very important thing is that we actually in order to be able to do just basic queries, we need to first attribute an index to the field where the geospatial data that we're searching for is stored. So in this case, we need to add an index to start location. So let's do that here in tour model. So down here, we need yet another index. Tour schema.index. Start location, but now we're actually not going to set it to one or minus one, because this time it is a different index that we need. So for geospatial data, this index needs to be a 2D sphere index if the data describes real points on the Earth like sphere. Or instead, we can also use a 2D index if we're using just fictional points on a simple two dimensional plane. Now in this case of course, we are talking about real points on the Earth's surface, so we're going to use a 2D sphere index here. So a 2D sphere like this. Okay, and so we're basically telling that this start location here should be indexed to a 2D sphere. So an Earthlike sphere where all our data are located. Great, and with that, we should now actually be ready
