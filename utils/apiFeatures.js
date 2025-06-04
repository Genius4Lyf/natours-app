class APIfeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // BUILD QUERY
  filter() {
    // 1A.Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // READING DOCUMENTS FROM OUR DATABASE
    // const tours = await Tour.find(queryObj);

    // 1B.Advance Filtering
    let queryStr = JSON.stringify(queryObj); //converting the queryObj to a string then ...

    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    //Using a regular expression to match 1 of these four words with the words that will be provided backslash b (\b()\b) will provide the words with exactly the words in the expression and not words having it

    this.query = this.query.find(JSON.parse(queryStr)); //This find method here is going to return a query, as we can see in example 'b' below, we are able to chain a the Tour.find() method because it returns a query and when we await it with async await, we get the document stored in a variable.
    return this;
  }

  //   SORTING
  sort() {
    // SORTING
    // Setting the sorting value to ?sort=-price will make the sorting be in decending order
    // while setting ?sort=price will be in ascending order
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //the req.query.sort gets split using the split method which will return a new array and then gets joined with the join method by using the space inbetween
      //   sortBy = 'price ratingsAverage' depending on the query inputed
      this.query = this.query.sort(sortBy);
    } else {
      // DEFAULT WHEN NO SORT IS SPECIFIED
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  //   LIMITING
  limitFields() {
    // FIELD LIMITING
    // Setting the field value to ?field=-name /  query.select('-__v') will exclude that field from the response and return everything else
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // DEFAULT WHEN NO SORT IS SPECIFIED
      this.query = this.query.select('-__v');
    }

    return this;
  }

  //   PAGINATION
  paginate() {
    // PAGINATION
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //The equation here is getting the page number, and first substracting by 1, and then mulplying by the limit,
    // So if we requet for page number 2, our skip value will then be 1, 1 * 10 = 10, and so 10 results will be skipped, and the other result to be provided will be 10, if limit was set to be 10
    // page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIfeatures;
