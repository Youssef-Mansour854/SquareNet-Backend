const asyncHandler = require("express-async-handler");
const ReviewModel = require("../models/ReviewModel");
const PropertyModel = require("../models/PropertyModel");
const ApiError = require("../utils/apiError");
const { createNotification } = require("./notificationController");

// @desc    Get all reviews for a specific property
// @route   GET /api/v1/reviews?propertyId=xxx
// @access  Public
exports.getReviews = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.query.propertyId) {
    filter = { property: req.query.propertyId };
  }

  const reviews = await ReviewModel.find(filter)
    .sort("-createdAt")
    .populate("user", "name profileImg");

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: reviews,
  });
});

// @desc    Get a single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await ReviewModel.findById(req.params.id).populate(
    "user",
    "name profileImg"
  );

  if (!review) {
    return next(new ApiError("Review not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: review,
  });
});

// @desc    Create a review
// @route   POST /api/v1/reviews
// @access  Protected/User
exports.createReview = asyncHandler(async (req, res, next) => {
  const { rating, comment, title, propertyId } = req.body;

  // Check if property exists
  const property = await PropertyModel.findById(propertyId);
  if (!property) {
    return next(new ApiError("Property not found", 404));
  }

  // Check if user already reviewed this property
  const existingReview = await ReviewModel.findOne({
    user: req.user._id,
    property: propertyId,
  });

  if (existingReview) {
    return next(new ApiError("لقد قمت بتقييم هذا العقار من قبل", 400));
  }

  const review = await ReviewModel.create({
    title,
    rating,
    comment,
    user: req.user._id,
    property: propertyId,
  });

  // Send notification to property owner
  if (property.ownerId && property.ownerId.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: property.ownerId,
      type: "new_review",
      title: "تقييم جديد",
      body: `${req.user.name} أضاف تقييم (${rating}⭐) على عقار "${property.title}"`,
      property: propertyId,
    });
  }

  res.status(201).json({
    status: "success",
    data: review,
  });
});

// @desc    Update a review
// @route   PUT /api/v1/reviews/:id
// @access  Protected/User (owner of review)
exports.updateReview = asyncHandler(async (req, res, next) => {
  const review = await ReviewModel.findById(req.params.id);

  if (!review) {
    return next(new ApiError("Review not found", 404));
  }

  // Check ownership
  if (review.user.toString() !== req.user._id.toString()) {
    return next(new ApiError("You are not allowed to update this review", 403));
  }

  review.title = req.body.title || review.title;
  review.rating = req.body.rating || review.rating;
  review.comment = req.body.comment || review.comment;

  await review.save();

  res.status(200).json({
    status: "success",
    data: review,
  });
});

// @desc    Delete a review
// @route   DELETE /api/v1/reviews/:id
// @access  Protected/User (owner) or Admin
exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await ReviewModel.findById(req.params.id);

  if (!review) {
    return next(new ApiError("Review not found", 404));
  }

  // Check ownership or admin
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    return next(new ApiError("You are not allowed to delete this review", 403));
  }

  await ReviewModel.findByIdAndDelete(req.params.id);

  res.status(204).send();
});
