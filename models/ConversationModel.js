const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    property: {
      type: mongoose.Schema.ObjectId,
      ref: "Property",
      required: false, // Optional: if chat is tied to a specific property
    },
    lastMessage: {
      type: mongoose.Schema.ObjectId,
      ref: "ChatMessage", // Reference to the latest message for the UI conversation list
    },
    unreadCount: {
      type: Map,
      of: Number, // Stores unread count per user ID. E.g., { "userId1": 2, "userId2": 0 }
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
