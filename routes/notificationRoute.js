const express = require("express");
const { protect } = require("../controllers/authController");
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  markSenderMessagesRead,
} = require("../controllers/notificationController");

const router = express.Router();

// All routes are protected
router.use(protect);

router.get("/", getMyNotifications);
router.put("/read-all", markAllAsRead);
router.put("/read-sender/:senderId", markSenderMessagesRead);
router.put("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

module.exports = router;
