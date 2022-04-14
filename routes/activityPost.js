const express = require("express");
const Comment = require("./comments");
const router = express.Router();
const commentRouter = require("./comments");

const {
  createPost,
  getOnePost,
  updatePost,
  deletePosts,
  postPhotoUpload,
} = require("../controllers/activites");

const { sendEthereum } = require("../controllers/sendEthereum");

const { protect, authorize } = require("../middleware/auth");

router.use("/:postID/comment", commentRouter);

router.route("/").post(protect, authorize("publisher", "admin"), createPost);

//SEND ETHERUEM
router
  .route("/sendEthereum")
  .post(protect, authorize("publisher", "admin"), sendEthereum);

router
  .route("/:id")
  .put(protect, authorize("publisher", "admin"), updatePost)
  .delete(protect, authorize("publisher", "admin"), deletePosts)
  .get(protect, authorize("publisher", "admin"), getOnePost);

module.exports = router;
