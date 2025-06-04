const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    // This is parent referencing, whereby the tours does not know about the reviews and the users does not know about the reviews.
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'], //Now each review document now knows exactly what tour it belongs to
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      require: [true, 'Review must belong to a user'],
    },
  },
  //  Schema Options Object
  {
    toJSON: { virtuals: true }, // each time the documents/data gets outputed as JSON, we want virtuals set to true
    toObject: { virtuals: true }, // each time the documents/data gets outputed as Object, we want virtuals set to true
  }, //that is the data will be part of the output
);

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name',
  // So remember, we start with the path property,and this one is going to be for tour and by specifying tour here, means thatthis field here, which has the exact some name,is then going to be the one that's populatedbased on a tour model.Well, because that's what we specified here, okay.So the reference is to a model called tour,and basically it's in that collection where Mongoose is thengoing to look for documents with the ID that we specified.
  //   })
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    //1. select all the reviews that belong to the current tour passed in as an argument
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Preventing Duplicate reviews
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //compound index to ensure one user cannot write 2 review for a tour

// calculating and saving the review statistics. when a review is created
reviewSchema.post('save', function () {
  //   used for calling the calcAverageRatings
  this.constructor.calcAverageRatings(this.tour);
});

// calculating the review statistics. This time, for when a review is updated or deleted.
reviewSchema.pre(/^findOneAnd/, async function (next) {
  const r = await this.findOne(); // we used this way of passing the data from the pre middleware after it was created into the document to the post middleware reviewSchema.post(/^findOneAnd/,...
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  // await this.findOne(); does NOT work here, query has already executed
  await this.r.constructor.calcAverageRatings(this.r.tour); //and here we retrieved the document from the post middleware because at this point, the query is already executed
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
// So remember, we start with the path property,and this one is going to be for tour.So again, by specifying tour here, means thatthis field here, which has the exact some name,is then going to be the one that's populatedbased on a tour model.Well, because that's what we specified here, okay.So the reference is to a model called tour,and basically it's in that collection where Mongoose is thengoing to look for documents with the ID that we specified
