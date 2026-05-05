const express = require("express");
const { protect } = require("../controllers/authController");
const {
  sendMessage,
  getPropertyMessages,
  getAllMessages,
  markAsRead,
  deleteMessage,
} = require("../controllers/messageController");

const router = express.Router();

// Public: anyone can send a message
router.post("/", sendMessage);

// Protected: only logged in users can view/manage messages
router.use(protect);
router.get("/", getAllMessages);
router.get("/property/:propertyId", getPropertyMessages);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteMessage);

module.exports = router;
