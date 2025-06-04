//This script was built to import the TOUR DATA from our json file into the mongodb database
// THis script is completely independent of the rest of our express application and we will run completely from the command line just to import everything once
// CORE MODULES
const fs = require('fs');
// MONGOOSE DATABASE
const mongoose = require('mongoose');
// DOT ENV MODULE
const dotenv = require('dotenv');
// TOUR MODULE
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

// SETTING THE ENVIRONMENT VARIABLE from the './config.env file'
dotenv.config({ path: './config.env' });

// DATABASE RELATED
// THE DATABASE RESTFUL API WAS BUILT BEFORE ADDING THE DATABASE
// REPLACEING THE PASSWORD ON THE CONNECTION STRING WITH THE ONE STORED ON THE ENV VARIABLE
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

// CONNECTING THE DATABASE TO THE APP (DATABASE RELATED)
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    console.log('the connection is successfully made');
  });

// READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// WHAT ABOUT THE DATAS ALREADY IN THE DATABASE? We will build a way that we can easily delete the data at the same time
// DELETE ALL DATA FROM DB

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

console.log(process.argv);

// calling out the function on the commanline
// by running =>
// nodemon dev-data/data/import-dev-data.js --import
// or
// nodemon dev-data/data/import-dev-data.js --delete
// we get an array like this
// [
//   'C:\\Program Files\\nodejs\\node.exe',
//   'C:\\Users\\udofi\\Desktop\\WEBDEV\\BACKEND\\complete-node-bootcamp\\4-natours\\starter\\dev-data\\data\\import-dev-data.js',
//   '--import'
// ] these are the arguments/data that we can use in writing a very simple command line application which will import the data when we specify the "import" and will delete the data when specify the delete option

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

// run using the node js terminal
// if you have any data there, you can run delete first
// node ./dev-data/data/import-dev-data.js --delete
// then
// node ./dev-data/data/import-dev-data.js --import
