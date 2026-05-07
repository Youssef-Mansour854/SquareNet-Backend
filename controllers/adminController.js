const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const PropertyModel = require("../models/PropertyModel");
const ReviewModel = require("../models/ReviewModel");
const ConversationModel = require("../models/ConversationModel");
const ApiError = require("../utils/apiError");

// @desc    Get admin dashboard stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin/SuperAdmin
exports.getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProperties,
    totalReviews,
    totalConversations,
    activeProperties,
    soldProperties,
    usersByType,
    recentUsers,
    recentProperties,
    featuredProperties,
  ] = await Promise.all([
    User.countDocuments(),
    PropertyModel.countDocuments(),
    ReviewModel.countDocuments(),
    ConversationModel.countDocuments(),
    PropertyModel.countDocuments({ status: "available" }),
    PropertyModel.countDocuments({ status: "sold" }),
    User.aggregate([
      { $group: { _id: "$accountType", count: { $sum: 1 } } },
    ]),
    User.find()
      .sort("-createdAt")
      .limit(5)
      .select("name email accountType role createdAt profileImg"),
    PropertyModel.find()
      .sort("-createdAt")
      .limit(5)
      .select("title price location type status createdAt image")
      .populate("ownerId", "name"),
    PropertyModel.countDocuments({ featured: true }),
  ]);

  const userTypes = {};
  usersByType.forEach((item) => {
    userTypes[item._id || "unknown"] = item.count;
  });

  res.status(200).json({
    status: "success",
    data: {
      overview: {
        totalUsers,
        totalProperties,
        totalReviews,
        totalConversations,
        activeProperties,
        soldProperties,
        featuredProperties,
      },
      userTypes,
      recentUsers,
      recentProperties,
    },
  });
});

const bcrypt = require("bcryptjs");

// ─── User Management ──────────────────────────────────────

// @desc    Create new admin
// @route   POST /api/v1/admin/users/create-admin
// @access  Private/SuperAdmin
exports.createAdmin = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Only superadmin can create other admins/superadmins
  if (req.user.role !== 'superadmin') {
    return next(new ApiError("Only superadmin can create staff accounts", 403));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'admin',
    accountType: 'owner', // Default for staff for easier access
  });

  res.status(201).json({ status: "success", data: user });
});

// @desc    Get all users for admin
// @route   GET /api/v1/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .sort("-createdAt")
    .select("-password -__v");

  res.status(200).json({ status: "success", results: users.length, data: users });
});

// @desc    Update user role
// @route   PUT /api/v1/admin/users/:id/role
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const { role } = req.body;
  if (!['user', 'admin', 'superadmin'].includes(role)) {
    return next(new ApiError("Invalid role", 400));
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) return next(new ApiError("User not found", 404));

  // Only superadmin can change roles of other admins or promote someone to admin
  if (req.user.role !== 'superadmin' && (targetUser.role !== 'user' || role !== 'user')) {
    return next(new ApiError("Only superadmin can manage staff roles", 403));
  }

  targetUser.role = role;
  await targetUser.save();

  res.status(200).json({ status: "success", data: targetUser });
});

// @desc    Toggle user active status
// @route   PUT /api/v1/admin/users/:id/toggle-active
exports.toggleUserActive = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError("User not found", 404));

  // Regular admin cannot deactivate superadmins
  if (req.user.role !== 'superadmin' && user.role === 'superadmin') {
    return next(new ApiError("Admins cannot deactivate superadmins", 403));
  }

  user.active = !user.active;
  await user.save();

  res.status(200).json({ status: "success", data: user });
});

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError("User not found", 404));

  // Only superadmin can delete other admins or superadmins
  if (req.user.role !== 'superadmin' && user.role !== 'user') {
    return next(new ApiError("Only superadmin can delete staff accounts", 403));
  }

  await User.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// ─── Property Management ──────────────────────────────────

// @desc    Get all properties for admin
// @route   GET /api/v1/admin/properties
exports.getAllProperties = asyncHandler(async (req, res) => {
  const properties = await PropertyModel.find()
    .sort("-createdAt")
    .populate("ownerId", "name email")
    .populate("category", "name");

  res.status(200).json({ status: "success", results: properties.length, data: properties });
});

// @desc    Toggle property featured status
// @route   PUT /api/v1/admin/properties/:id/toggle-featured
exports.toggleFeatured = asyncHandler(async (req, res, next) => {
  const property = await PropertyModel.findById(req.params.id);
  if (!property) return next(new ApiError("Property not found", 404));

  property.featured = !property.featured;
  await property.save();

  res.status(200).json({ status: "success", data: property });
});

// @desc    Delete property (admin)
// @route   DELETE /api/v1/admin/properties/:id
exports.deleteProperty = asyncHandler(async (req, res, next) => {
  const property = await PropertyModel.findByIdAndDelete(req.params.id);
  if (!property) return next(new ApiError("Property not found", 404));

  res.status(204).send();
});

// ─── Review Management ────────────────────────────────────

// @desc    Get all reviews for admin
// @route   GET /api/v1/admin/reviews
exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await ReviewModel.find()
    .sort("-createdAt")
    .populate("user", "name email profileImg")
    .populate("property", "title");

  res.status(200).json({ status: "success", results: reviews.length, data: reviews });
});

// @desc    Delete review (admin)
// @route   DELETE /api/v1/admin/reviews/:id
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await ReviewModel.findByIdAndDelete(req.params.id);
  if (!review) return next(new ApiError("Review not found", 404));

  res.status(204).send();
});
