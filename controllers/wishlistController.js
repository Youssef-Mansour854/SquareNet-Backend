const asyncHandler = require("express-async-handler");
const UserModel = require("../models/userModel");

// @desc    Add property to wishlist
// @route   POST /api/v1/wishlist
// @access  Protected/User
exports.addPropertyToWishlist = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { wishlist: req.body.propertyId },
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Property added successfully to your wishlist.",
    data: user.wishlist,
  });
});

// @desc    Remove property from wishlist
// @route   DELETE /api/v1/wishlist/:propertyId
// @access  Protected/User
exports.removePropertyFromWishlist = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { wishlist: req.params.propertyId },
    },
    { new: true }
  );

  res.status(200).json({
    status: "success",
    message: "Property removed successfully from your wishlist.",
    data: user.wishlist,
  });
});

// @desc    Get logged user wishlist
// @route   GET /api/v1/wishlist
// @access  Protected/User
exports.getLoggedUserWishlist = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findById(req.user._id).populate("wishlist");

  res.status(200).json({
    status: "success",
    results: user.wishlist.length,
    data: user.wishlist,
  });
});
