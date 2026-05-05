const express = require('express');
const { protect } = require('../controllers/authController');
const {
  getConversations,
  startConversation,
  getMessages,
  editMessage,
  deleteMessage,
  markMessagesRead,
} = require('../controllers/chatController');

const router = express.Router();

// All chat routes require authentication
router.use(protect);

router.route('/conversations')
  .get(getConversations)
  .post(startConversation);

router.get('/messages/:conversationId', getMessages);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);
router.put('/messages/:conversationId/read', markMessagesRead);

module.exports = router;
