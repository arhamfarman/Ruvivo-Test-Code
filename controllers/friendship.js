const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Comment = require("../model/comments");
const User = require("../model/Users");
const { use } = require("../routes/comments");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const { send } = require("process");

//@desc    Forgot Password
//@route   POST /api/v1/friends/sendrequest
//@access  Public

exports.sendReq = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  const sender = req.body.sender;
  if (!user) {
    return next(new ErrorResponse("Theres no user with that email", 404));
  }

  //Get reset token

  const requestToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  // const senderName = user.name

  // Create reset URL
  const requestURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/friends/acceptrequest/${requestToken}/${sender}`;

  const message = `I want to be friends with you. Please make a PUT request to check my invite to: ${requestURL}`;

  res.status(200).json({
    success: true,
    data: message,
  });
});

//@desc    AcceptRequest
//@route   PUT /api/v1/auth/acceptrequest/:token
//@access  Private

exports.acceptRequest = asyncHandler(async (req, res, next) => {
  //Get hashed token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");

  const sender = req.params.name;
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse("Invalid token", 400));
  }

  // var numberOfFriends = user.numberOfFriends

  //Set the new password
  //  user.numberOfFriends = numberOfFriends+1
  user.friends = [...user.friends, sender]; /////////
  user.numberOfFriends = user.friends.length;
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

//@desc    Get  All Friends of a single User
//@route   GET /api/v1/friends/:postId/friends
//@access  Public

exports.getFriends = asyncHandler(async (req, res, next) => {
  const friends = await User.findById(req.params.id);

  res.status(200).json({
    success: true,
    count: friends.length,
    data: friends.friends,
  });
});
