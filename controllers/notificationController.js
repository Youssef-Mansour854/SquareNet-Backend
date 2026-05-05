const asyncHandler = require("express-async-handler");
const NotificationModel = require("../models/NotificationModel");
const ApiError = require("../utils/apiError");

// @desc    Get all notifications for the logged-in user
// @route   GET /api/v1/notifications
// @access  Protected
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await NotificationModel.find({ recipient: req.user._id })
    .sort("-createdAt")
    .limit(50)
    .populate("property", "title image");

  const unreadCount = await NotificationModel.countDocuments({
    recipient: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    status: "success",
    results: notifications.length,
    unreadCount,
    data: notifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Protected
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await NotificationModel.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(new ApiError("Notification not found", 404));
  }

  res.status(200).json({ status: "success", data: notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Protected
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationModel.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({ status: "success", message: "All notifications marked as read" });
});

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Protected
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await NotificationModel.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    return next(new ApiError("Notification not found", 404));
  }

  res.status(204).send();
});

// Helper: create a notification (used internally by other controllers)
exports.createNotification = async ({ recipient, type, title, body, property, sender }) => {
  try {
    await NotificationModel.create({ recipient, type, title, body, property, sender });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};

// @desc    Mark all message notifications from a specific sender as read
// @route   PUT /api/v1/notifications/read-sender/:senderId
// @access  Protected
exports.markSenderMessagesRead = asyncHandler(async (req, res) => {
  await NotificationModel.updateMany(
    {
      recipient: req.user._id,
      type: "new_message",
      sender: req.params.senderId,
      isRead: false,
    },
    { isRead: true }
  );

  res.status(200).json({ status: "success", message: "Sender messages marked as read" });
});
