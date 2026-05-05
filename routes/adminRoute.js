const express = require("express");
const { protect, allowedTo } = require("../controllers/authController");
const {
  getStats,
  createAdmin,
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  deleteUser,
  getAllProperties,
  toggleFeatured,
  deleteProperty,
  getAllReviews,
  deleteReview,
} = require("../controllers/adminController");
const { createAdminValidator } = require("../utils/validators/adminValidator");

const router = express.Router();

router.use(protect);
router.use(allowedTo("admin", "superadmin"));

// Stats
router.get("/stats", getStats);

// Users
router.get("/users", getAllUsers);
router.post("/users/create-admin", createAdminValidator, createAdmin);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/toggle-active", toggleUserActive);
router.delete("/users/:id", deleteUser);

// Properties
router.get("/properties", getAllProperties);
router.put("/properties/:id/toggle-featured", toggleFeatured);
router.delete("/properties/:id", deleteProperty);

// Reviews
router.get("/reviews", getAllReviews);
router.delete("/reviews/:id", deleteReview);

module.exports = router;
