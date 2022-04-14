const express = require("express");
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  verifiedLogin,
  checkProfile,
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/login/:resetToken/verified", verifiedLogin);
router.get("/me", protect, getMe);
router.put("/updatedetails", protect, updateDetails);
router.post("/forgotpassword", forgotPassword);
router.get("/profile", checkProfile);
router.put("/resetpassword/:resetToken", resetPassword);

module.exports = router;
