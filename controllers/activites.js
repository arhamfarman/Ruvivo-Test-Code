const path = require("path");
const Post = require("../model/activitesPost");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const User = require("../model/Users");
// @desc    Create a Post
// @route   Post /api/v1/activites/post
// @access  Public

exports.createPost = asyncHandler(async (req, res, next) => {
  try {
    req.body.user = req.user.id;

    const post = await Post.create(req.body);

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    new ErrorResponse(err, 404);
  }
});

// @desc    Get  Single Post
// @route   GET /api/v1/poatactivity/:id
// @access  Public
exports.getOnePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  try {
    if (!post) {
      return next(new ErrorResponse(`No Post found `, 404));
    }
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    new ErrorResponse(err, 404);
  }
});

//@desc    Update a Post
//@route   PUT /api/v1/postactivity/:id
//@access  Public
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  try {
    if (!post) {
      // return res.status(400).json({success:false})
      return next(
        new ErrorResponse(`Post not found with he id of ${req.params.id}`, 404)
      );
    }

    //Make sure user is the bootcamp owner
    if (post.user.toString() !== req.user.id && req.user.role !== "admin") {
      return next(
        new ErrorResponse(
          `User with he id of ${req.params.id} is not authorized to update the post`,
          401
        )
      );
    }

    post = await Post.findOneAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: post });
  } catch (err) {
    new ErrorResponse(err, 404);
  }
});

//@desc    Delete  Posts
//@route   DELETE /api/v1/postactivity/:id
//@access  Public
exports.deletePosts = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(400).json({ success: false });
  }

  //Make sure user is the bootcamp owner
  if (post.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with he id of ${req.params.id} is not authorized to delete the post`,
        401
      )
    );
  }
  post.remove();
  res.status(200).json({ success: true, data: post });
});
