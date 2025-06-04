const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator'); //npm package for custom validators not provided by the database schema
const bcrypt = require('bcryptjs');

// name, email, photo, password, passwordConfirm
const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
    required: [true, 'Please specify the role of the user'],
  },
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true, //transform email to lowercase
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlenght: 8,
    select: false,
  },
  //   Never store plain password in the userbase
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      //this only works on CREATE AND SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Password are not thesame',
    },
  },
  passwordChangedAt: Date, //this property will always be changed when someone change password
  passwordResetToken: String,
  passwordResetExpires: Date, //security measure, you'll only have few minutes to reset your password
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// How are we going to implement this encryption
// we are ging to use a pre save middleware(Document middleware) //betweeen getting the data and saving the data
userSchema.pre('save', async function (next) {
  // A guard statement ot only run this function if password was modified
  if (!this.isModified('password')) return next();

  //   hash password
  this.password = await bcrypt.hash(this.password, 12);
  //   12 is now a default for the salt value
  //   hash is the asynchronous version of the bcrypt

  //   Delete the password field
  this.passwordConfirm = undefined; // setting the passwordConfired to undefined because we don't need it anymore, we do not need it to be persisted in the database
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  // sometimes a small problem happens. And that problem is that sometimes saving to the database is a bit slower than issuing the JSON Web Token, making it so that the changed password timestamp is sometimes set a bit after the JSON Web Token has been created. And so that will then make it so that the user will not be able to log in using the new token.
  // (return JWTTimestamp < changedtimestamp);
  // FOR BETTER UNDERSTANDING, LOOK INTO THE userSchema.changePassword after function
  this.passwordChangedAt = Date.now() - 2000; //and so again, sometimes it happens that this token is created a bit before the changed password timestamp has actually been created. And so, we just need to fix that by subtracting one second. So, basically, a thousand milliseconds. And so that then will put the passwordChangedAt one second in the past, okay, which will then of course, not be 100% accurate, but that's not a problem at all,
  next();
});

// FIND THE active property in the document and query the database to only output users not equal to false
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// comparing encrypted password for login access on the authController
// AN INSTANCE METHOD
// An instance method is a method that is going to be available on all documents of certain collections
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  // the goal of this function is to return a boolean
  return await bcrypt.compare(candidatePassword, userPassword);
  //   candidatePassword is not hashed but the user password is nhashed and this comparison is only done with this method
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.changedPasswordAt) {
    const changedtimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );

    console.log(changedtimestamp, JWTTimestamp);

    return JWTTimestamp < changedtimestamp;
  }

  //   fales means NOT CHANGED
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // The password reset token should basically be a random string and at the same time it doesn't need to be as cryptographically strong as the password hash instead we can just use the very simple random bytes function from the built in crypto model
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken });
  console.log('Passwordhash', this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Date.now + minutes + seconds  * milliseconds

  // return plaintext token
  return resetToken;
};

// Model variable are usaully with a capital letter
const User = mongoose.model('User', userSchema);

module.exports = User;
