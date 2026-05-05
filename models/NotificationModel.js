const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Notification must have a recipient"],
    },
    type: {
      type: String,
      enum: ["new_message", "new_review", "property_sold", "wishlist_update", "system"],
      required: [true, "Notification type is required"],
    },
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },
    body: {
      type: String,
      trim: true,
    },
    property: {
      type: mongoose.Schema.ObjectId,
      ref: "Property",
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for quick lookup
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const NotificationModel = mongoose.model("Notification", notificationSchema);

module.exports = NotificationModel;
