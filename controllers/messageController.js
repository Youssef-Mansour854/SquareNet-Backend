const asyncHandler = require("express-async-handler");
const MessageModel = require("../models/MessageModel");
const PropertyModel = require("../models/PropertyModel");
const ApiError = require("../utils/apiError");
const { createNotification } = require("./notificationController");

// @desc    Send a message to property owner
// @route   POST /api/v1/messages
// @access  Public
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { name, email, phone, message, propertyId } = req.body;

  // Check if property exists
  const property = await PropertyModel.findById(propertyId);
  if (!property) {
    return next(new ApiError("Property not found", 404));
  }

  const newMessage = await MessageModel.create({
    name,
    email,
    phone,
    message,
    property: propertyId,
  });

  // Send notification to property owner
  if (property.ownerId) {
    await createNotification({
      recipient: property.ownerId,
      type: "new_message",
      title: "رسالة جديدة",
      body: `${name} أرسل لك رسالة على عقار "${property.title}"`,
      property: propertyId,
    });
  }

  res.status(201).json({
    status: "success",
    message: "تم إرسال رسالتك بنجاح وسيتم التواصل معك قريباً",
    data: newMessage,
  });
});

// @desc    Get all messages for a specific property
// @route   GET /api/v1/messages/property/:propertyId
// @access  Protected
exports.getPropertyMessages = asyncHandler(async (req, res, next) => {
  const messages = await MessageModel.find({ property: req.params.propertyId })
    .sort("-createdAt")
    .populate("property", "title");

  res.status(200).json({
    status: "success",
    results: messages.length,
    data: messages,
  });
});

// @desc    Get all messages (for admin/owner dashboard)
// @route   GET /api/v1/messages
// @access  Protected
exports.getAllMessages = asyncHandler(async (req, res, next) => {
  const messages = await MessageModel.find()
    .sort("-createdAt")
    .populate("property", "title location image");

  res.status(200).json({
    status: "success",
    results: messages.length,
    data: messages,
  });
});

// @desc    Mark message as read
// @route   PUT /api/v1/messages/:id/read
// @access  Protected
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const message = await MessageModel.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  if (!message) {
    return next(new ApiError("Message not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: message,
  });
});

// @desc    Delete a message
// @route   DELETE /api/v1/messages/:id
// @access  Protected
exports.deleteMessage = asyncHandler(async (req, res, next) => {
  const message = await MessageModel.findByIdAndDelete(req.params.id);

  if (!message) {
    return next(new ApiError("Message not found", 404));
  }

  res.status(204).send();
});
