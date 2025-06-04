const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory');

// Defining Multer USED FOR FILE UPLOADS
const multer = require('multer'); // after defining multer, we nned to config multer upload

const sharp = require('sharp');

// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     // user-3047203829203-3232032032.jpeg
//     const ext = file.mimetype.split('/')[1]; //mimetype looks like this = 'image/jpeg'
//     console.log(ext);
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// }); //this fuction is used in how we want to store our files, so it is going to be called like this
// the function above was changed so we could store in the memory
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

exports.uploadUserPhoto = upload.single('photo'); //Middleware for uploading fhooto
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`); //sharp(req.file.buffer) calling the sharp function like this here will then create an object on which we can chain multiple methods in order to do our image processing.

  next();
});

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

// UPDATING THE CURRENT USER DATA
exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file) //checking the body for the request file
  // console.log(req.body) //checking the body of the req
  // 1. Create error if yser POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password  updates. Please use /updateMyPassword',
      ),
    );
  }
  // 2. Update user document
  // i. Filter the request sent to the app
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  // ii. Find and Update User
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true, // new option set to true, so that it returns the new object, so basically the updated object instead of the old one.
    runValidators: true, // And the also runValidators set to true. Because indeed we want the models to validate our document. So for example, if we put in an invalid email address, that should be catched by the Validator and return an error.
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
  // res.status(200).render('account', {
  //   status: 'success',
  //   title: 'Your Account',
  //   user: updatedUser,
  // });
});

// Now why am I putting filteredBody here, and not simply request.body on the findByIdAndUpdate Method? Well that's because we actually do not want to update everything that's in the body, because let's say the user puts, in the body, the role for example. We could have body.role set to admin for example, and so this would then allow any user to change the role, for example, to administrator. And of course that can not be allowed. Or the user could also change their reset token, or when that reset token expires, and all of that should not be allowed of course. So doing something like this would of course be a huge mistake. And so we need to make sure that the object that we pass here, so again that object that will contain the data that's gonna be updated, only contains name and email, because for now these are the only fields that we want to allow to update. And so basically we want to filter the body so that in the end, it only contains name and email and nothing else. So if then the user tries to change the role, that will then be filtered out so that it never finds its way to our database. So what we want to do is to basically create a variable and let's say filteredBody,

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.createUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined, please use /signup instead',
  });
};

// FACTORY HANDLERS FOR USERS
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User); // DON NOT UPDATE PASSWORD WITH THIS
exports.deleteUser = factory.deleteOne(User);
