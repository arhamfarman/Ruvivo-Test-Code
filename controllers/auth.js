const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../model/Users");
const { unsubscribe, use } = require("../routes/auth");
const sendEmail = require("../utils/sendEmail.js");
const crypto = require("crypto");
const octokitRequest = require("@octokit/request");
const { exists, findOne } = require("../model/Users");
const { request } = require("@octokit/request");
var http = require("http");
var https = require("https");
const { json } = require("body-parser");
const jwt = require("jsonwebtoken");
const Users = require("../model/Users");
const { token } = require("morgan");

//@desc    Register User
//@route   POST /api/v1/auth/register
//@access  Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, firstName, lastName, displayName, password } = req.body;
  // const user = await User.findOne({email:req.body.email })
  const em = await User.findOne({ email });

  if (em) {
    return next(new ErrorResponse("User with that email already exists", 404));
  }

  const verifEM = verifyEmail(email);

  if (!verifEM) {
    return next(new ErrorResponse("Invalid Email", 404));
  }

  const user = await User.create({
    name,
    email,
    password,
    firstName,
    lastName,
    displayName,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Verify
//function
function verifyEmail(email) {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

//@desc    Verified Login
//@route   POST /api/v1/auth/login/:resetToken
//@access  Public

exports.verifiedLogin = asyncHandler(async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email });

  //status changed to verified
  user.verificationStatus = "verified"; /////////
  user.numberOfFriends = user.friends.length;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc    Login User
//@route   POST /api/v1/auth/Login
//@access  Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const pass = await User.findOne({ email });

  if (!pass) {
    return next(new ErrorResponse("Email not verified", 400));
  }

  //Validate email and password
  if (!email || !password) {
    return next(
      new ErrorResponse("Please provide an email and a password", 400)
    );
  }

  const verifStatus = pass.verificationStatus;

  if (verifStatus == "unverified") {
    return next(new ErrorResponse("User not Verified", 400));
  }

  //Check for the user

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorResponse("Invalid email or password", 401));
  }

  //Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse("Invalid email or password", 401));
  }

  sendTokenResponse(user, 200, res);
});

//@desc    Get current logged in user
//@route   POST /api/v1/auth/Login
//@access  Private

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Update user details
//@route   PUT /api/v1/auth/updatedetails
//@access  Private

exports.updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc    Forgot Password
//@route   POST /api/v1/auth/forgotpassword
//@access  Public

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorResponse("Theres no user with that email", 404));
  }

  //Get reset token

  const resetToken = user.getResetPasswordToken();

  await user.save();

  // Create reset URL
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `You have requested the reset of a password. Please make a PUT request to: ${resetURL}`;

  res.status(200).json({
    success: true,
    data: message,
  });
});

//@desc    Reset Password
//@route   PUT /api/v1/auth/resetPassword/:resetoken
//@access  Private

exports.resetPassword = asyncHandler(async (req, res, next) => {
  //Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  //Set the new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  //Create Token
  const token = user.getSignedJwtTokens();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

//@desc    Check User Profile
//@route   POST /api/v1/postactivity/:id
//@access  Public
exports.checkProfile = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;

  try {
    var decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log(decoded.id);

    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ErrorResponse("No user found", 400));
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    return next(new ErrorResponse(err, 400));
  }
});

function generateString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  length = 10;
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  result.toString;
  return result;
}
