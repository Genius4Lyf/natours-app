exports.getAllTours = async (req, res) => {
  try {
    console.log(req.query); //req.query gives us an object with the data from the query string
    // BUILD QUERY
    // 1A.Filtering
    const queryObj = { ...this.querySting };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // READING DOCUMENTS FROM OUR DATABASE
    // const tours = await Tour.find(queryObj);

    // 1B.Advance Filtering
    let queryStr = JSON.stringify(queryObj); //converting the queryObj to a string then ...
    console.log('Query String:', queryStr);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //Using a regular expression to match 1 of these four words with the words that will be provided backslash b (\b()\b) will provide the words with exactly the words in the expression and not words having it
    console.log(JSON.parse(queryStr));

    let query = Tour.find(JSON.parse(queryStr)); //This find method here is going to return a query, as we can see in example 'b' below, we are able to chain a the Tour.find() method because it returns a query and when we await it with async await, we get the document stored in a variable.

    // example of manually writing the filter object
    // {difficulty: 'easy', duration: {$gte: 5}}

    // SORTING
    // Setting the sorting value to ?sort=-price will make the sorting be in decending order
    // while setting ?sort=price will be in ascending order
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' '); //the req.query.sort gets split using the split method which will return a new array and then gets joined with the join method by using the space inbetween
      //   sortBy = 'price ratingsAverage' depending on the query inputed
      query = query.sort(sortBy);
    } else {
      // DEFAULT WHEN NO SORT IS SPECIFIED
      query = query.sort('-createdAt');
    }

    // FIELD LIMITING
    // Setting the field value to ?field=-name /  query.select('-__v') will exclude that field from the response and return everything else
    if (req.query.fields) {
      const fields = req.query.fields.split(',').join(' ');
      query = query.select(fields);
    } else {
      // DEFAULT WHEN NO SORT IS SPECIFIED
      query = query.select('-__v');
    }

    // PAGINATION
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //The equation here is getting the page number, and first substracting by 1, and then mulplying by the limit,
    // So if we requet for page number 2, our skip value will then be 1, 1 * 10 = 10, and so 10 results will be skipped, and the other result to be provided will be 10, if limit was set to be 10
    // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
    query = query.skip(skip).limit(limit);

    if (req.query.page) {
      const numTours = await Tour.countDocuments();
      if (skip >= numTours) throw new Error('This page does not exist');
    }

    // EXECUTE QUERY
    // const tours = await query; //when the queries are use in the getAllTours function

    const features = new APIfeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;
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
      results: tours.length,
      requestedAt: req.requestTime,
      data: {
        tours: tours,
      },
    });
    //   res.send('Hello World!');
  } catch (err) {
    res.status(404).json({
      status: 'Fail',
      message: err,
    });
  }
};
