// MONGOOSE DATABASE
const mongoose = require('mongoose');

// SLUGIFY
const slugify = require('slugify'); //npm package
// const validator = require('validator'); npm package

// THE MONGOOSE SCHEMA
// This is a template of a mongoose schema
// const tourSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: [Boolean, 'error message'],
//   },
//   rating: Number,
//   price: {
//     type: Number,
//     required: [Boolean, 'error message'],
//   },
// });
//
// In the mongoose.schema, we can pass in not only the object with the schema definition itself but also an object for the schema options
const tourSchema = new mongoose.Schema(
  // Schema Object
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxength: [40, 'A tour name must have less or equal than 40 characters'],
      minlength: [10, 'A tour name must have more or equal than 10 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      default: 4.5,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficult is either: easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Ratings must be above 5.0'],
      set: (val) => Math.round(val * 10) / 10, //used to round the ratings from 4.666666, to 47 / 10 = 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [Boolean, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Dicount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true, //trim only work for strings. Removes all the white spaces inputed
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [String],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // geospatial data
    // Now, MongoDB supports geospatial data out of the box. And geospatial data is basically data that describes places on earth using longitude and latitude coordinates. Okay, so we can describe simple points or we can also describe more complex geometries like lines or even polygons or even multi-polygons
    startLocation: {
      //This object is not a schema type options object, it is an embedded object where we can specify some properties and for the this to be recognised as a GeoJSON, we need the type and the coordinates

      // UNDER DATA MODEL SECTION
      // GeoJSON
      type: {
        //this is the schema type options
        type: String,
        default: 'Point', //we can specify multiple geometry on geospatial
        enum: ['Point'], //possible options this field can take
      },
      coordinates: [Number],
      address: String,
      description: String,
      //Geo spatial data example template
    },
    // This is how you create embedded documents
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // guides: [], used for direct embedding
    ////////////////////////////////////////////////
    // So right here, we wanted to reference the the users who are guides in the tour document and by doing so, we did this. which we the later did a document middleware for 'pre' below
    guides: [
      {
        type: mongoose.Schema.ObjectId, //a new type that we never saw before And that is mongoose.Schema.objectId. And what this means is that we expect a type of each of the elements in the guides array to be a MongoDB ID.
        ref: 'User', //this is how we establish references between different data set in mongoose
      },
    ],
  },

  //  Schema Options Object
  {
    toJSON: { virtuals: true }, // each time the documents/data gets outputed as JSON, we want virtuals set to true
    toObject: { virtuals: true }, // each time the documents/data gets outputed as Object, we want virtuals set to true
  }, //that is the data will be part of the output
);

// USED FOR SORTING, FILTERING, ETC,  DOCUMENTS
tourSchema.index({ price: 1, ratingsAverage: -1 }); //with this, instead of mongoose to scan all document for price, when sorting with a giving value, it only examines the documents iwith the prices
//this compound index can be used for other fields as well
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' }); //what we are telling mongoDB here is that

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7; //7 days in a week, so if a tour has 7 days, it will be converted to 1 week
}); //the virtaul property will be created each time we get(.get(getter)) some data out of the database
// An arrow function is not used because an arrow function does not gets its own this keyword and in here we actually need the this keyword, because the this keyword in this case is going to be pointing to the current document. And so usually when we want to use this, then we should always use a regular function.

// Virtual Populate is
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //this is how the field was written in the review schema document at reviewModel
  localField: '_id', //this is what the field is refererenced with on the reviewModel at type: mongoose.Schema.ObjectId, we used the local field here '_id" to reference the foreign field at reviewModel
});

// DOCUMENT MIDDLEWARE: It runs before the .save() and .create()

tourSchema.pre(/^find/, function (next) {
  // this function will automatically populate(add)/reference the guide fields in the tours document
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  }); //populate will fill up the guides field with the actual data, only in the query and not in the database
  next();
});

tourSchema.pre('save', function (next) {
  // This function will be run before an actual document is saved to database
  console.log(this); // And so in a save middleware, the disk keyword here is gonna point to the currently processed document. And that is the reason why it is called document middleware. Again, because in this function here, we have access to the document that is being processed.

  this.slug = slugify(this.name, { lower: true });
  next();
}); // The pre middleware is going to run before an actual event and that event is the 'save' event
// IDEA: Before the document saves on the database, there should be a username created for that user

// tourSchema.post('save', function (next) {
// console.log(doc)}); the post middleware has access not only to next, but also to the document that was just saved to the database.
// And so post middleware functions are executed after all the pre middleware functions have completed, all right. So in here we actually no longer have the disk keyword, but instead we have the basically finished document here in doc.

// QUERY MIDDLEWARE
// Query Middleware allows us to run functions before or after a certain query is executed. And so let's now add a 'pre-find' hook, so basically, a middleware that is gonna run before any find query is executed.

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //select all documents that have secretTour not set to true.
  this.start = Date.now();
  // keep in mind that this here is now a query object, all right? And so we can chain all of the methods that we have for queries. And so that simply adds a find method here, and then basically select all the documents where secretTour is not true
  // /^find/: this is a regular expression that means all strings that starts with find
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds`);
  // console.log(docs) commented out so as not to flood console
  next();
}); //This middleware will run after the query is executed and therefore it can have access to the document that was retured

// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function () {
//   this.pipeline().unshift({ match: { secretTour: { $ne: true } } }); //logs the aggregation pipeline to the console
// });

//ThIS WAS USED TO EMBEDDED TOUR GUIDES INTO THE TOUR DOCUMENT BY USER'S ID
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => {
//     return await User.findById(id);
//   });
// this.guides = await Promise.all(guidesPromises); // we used Promise.all here because the guidesPromises is an array full of promises
//   next();
// });

// CREATING A MODULE ON THE SCHEMA (DATABASE RELATED)
const Tour = mongoose.model('Tour', tourSchema);

// Question, where do we actually need this tour? In other words, where are we actually going to create, and query and delete and update tours.
// Ans: In the tour Controller
module.exports = Tour; //We use module.exports when it is only one variable we are exporting out of the file

////////////// JUST FOR TESTING THAT WE CAN WRITE TO OUR DATABASE/////////////
// const testTour = new Tour({
//   name: 'The Forest Hiker',
//   rating: 4.7,
//   price: 478,
// });

// The resolved value of the doc from the promise maded by testTour.save() is the document from the database
// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('ERRORRR:', err);
//   });
