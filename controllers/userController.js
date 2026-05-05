const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const { uploadToCloudinary } = require("../utils/cloudinaryHelper");


// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find({});
  res.status(200).json({ results: users.length, data: users });
});

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  
  if (!user) {
    return next(new ApiError(`No user found for id ${id}`, 404));
  }
  res.status(200).json({ data: user });
});

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    profileImg: req.body.profileImg,
    role: req.body.role || 'user',
  });
  
  res.status(201).json({ data: user });
});

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndUpdate(
    id,
    {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      profileImg: req.body.profileImg,
      role: req.body.role,
    },
    { new: true }
  );
  
  if (!user) {
    return next(new ApiError(`No user found for id ${id}`, 404));
  }
  res.status(200).json({ data: user });
});

// @desc    Delete specific user
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  
  if (!user) {
    return next(new ApiError(`No user found for id ${id}`, 404));
  }
  res.status(204).send();
});

// -----------------------------
// Logged-in user (me) endpoints
// -----------------------------

// @desc    Get current logged-in user profile
// @route   GET /api/v1/users/me
// @access  Protected
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  res.status(200).json({ status: "success", data: user });
});

// @desc    Update current logged-in user profile (basic fields)
// @route   PUT /api/v1/users/me
// @access  Protected
exports.updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "bio", "address"];
  const payload = {};
  for (const key of allowedFields) {
    if (typeof req.body[key] !== "undefined") payload[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, payload, {
    new: true,
    runValidators: true,
  }).select("-password -__v");

  res.status(200).json({ status: "success", data: user });
});

// @desc    Upload current logged-in user profile image
// @route   PUT /api/v1/users/me/photo
// @access  Protected
exports.uploadProfileImage = uploadSingleImage("profileImg");

exports.resizeProfileImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  const publicId = `user-${uuidv4()}-${Date.now()}`;

  const processedBuffer = await sharp(req.file.buffer)
    .resize(300, 300)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toBuffer();

  // Upload to Cloudinary
  const imageUrl = await uploadToCloudinary(
    processedBuffer,
    "squarenet/users",
    publicId
  );

  req.body.profileImg = imageUrl;
  next();
});

exports.updateMyPhoto = asyncHandler(async (req, res) => {
  if (!req.body.profileImg) {
    return res.status(200).json({ status: "success", data: req.user });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { profileImg: req.body.profileImg },
    { new: true, runValidators: true }
  ).select("-password -__v");

  res.status(200).json({ status: "success", data: user });
});
