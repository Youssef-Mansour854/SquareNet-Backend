const express = require("express");
const { protect } = require("../controllers/authController");
const {
  getReviews,
  getReview,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const router = express.Router();

// Public routes
router.get("/", getReviews);
router.get("/:id", getReview);

// Protected routes
router.use(protect);
router.post("/", createReview);
router.put("/:id", updateReview);
router.delete("/:id", deleteReview);

module.exports = router;
