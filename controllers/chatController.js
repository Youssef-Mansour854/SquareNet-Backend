const Conversation = require('../models/ConversationModel');
const ChatMessage = require('../models/ChatMessageModel');
const ApiError = require('../utils/apiError');
const User = require('../models/userModel');

// @desc    Get all active conversations for a user
// @route   GET /api/v1/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({
      participants: { $in: [userId] },
    })
      .populate('participants', 'name email profileImg role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      results: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Start or find an existing conversation
// @route   POST /api/v1/chat/conversations
// @access  Private
exports.startConversation = async (req, res, next) => {
  try {
    const { receiverId, propertyId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return next(new ApiError('You cannot start a conversation with yourself', 400));
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(new ApiError('Receiver not found', 404));
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate('participants', 'name email profileImg role');

    if (!conversation) {
      // Create new
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        property: propertyId || null,
      });
      // Populate to get full participant info for frontend
      conversation = await conversation.populate('participants', 'name email profileImg role');
    }

    res.status(200).json({
      status: 'success',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for a specific conversation
// @route   GET /api/v1/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new ApiError('Conversation not found', 404));
    }

    if (!conversation.participants.includes(req.user._id)) {
      return next(new ApiError('Not authorized to view these messages', 403));
    }

    let messages = await ChatMessage.find({ conversationId })
      .populate('sender', 'name profileImg')
      .sort({ createdAt: 1 });

    // Mark messages as read (واجهة القراءة تعتمد على isRead في الرسائل الواردة)
    await ChatMessage.updateMany(
      { conversationId, sender: { $ne: req.user._id }, isRead: false, isDeleted: false },
      { isRead: true }
    );

    messages = await ChatMessage.find({ conversationId })
      .populate('sender', 'name profileImg')
      .sort({ createdAt: 1 });

    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a chat message
// @route   PUT /api/v1/chat/messages/:messageId
// @access  Private
exports.editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return next(new ApiError('Message text cannot be empty', 400));
    }

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return next(new ApiError('Message not found', 404));
    }

    if (message.sender.toString() !== userId.toString()) {
      return next(new ApiError('You can only edit your own messages', 403));
    }

    if (message.isDeleted) {
      return next(new ApiError('Cannot edit a deleted message', 400));
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    const populatedMsg = await ChatMessage.findById(message._id).populate('sender', 'name profileImg');

    res.status(200).json({
      status: 'success',
      data: populatedMsg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a chat message
// @route   DELETE /api/v1/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return next(new ApiError('Message not found', 404));
    }

    if (message.sender.toString() !== userId.toString()) {
      return next(new ApiError('You can only delete your own messages', 403));
    }

    message.isDeleted = true;
    message.text = 'تم حذف هذه الرسالة';
    await message.save();

    const populatedMsg = await ChatMessage.findById(message._id).populate('sender', 'name profileImg');

    res.status(200).json({
      status: 'success',
      data: populatedMsg,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read in a conversation
// @route   PUT /api/v1/chat/messages/:conversationId/read
// @access  Private
exports.markMessagesRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(new ApiError('Conversation not found', 404));
    }

    if (!conversation.participants.includes(userId)) {
      return next(new ApiError('Not authorized', 403));
    }

    await ChatMessage.updateMany(
      { conversationId, sender: { $ne: userId }, isRead: false, isDeleted: false },
      { isRead: true }
    );

    // Reset unread count for this user
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();

    res.status(200).json({
      status: 'success',
      message: 'Messages marked as read',
    });
  } catch (error) {
    next(error);
  }
};
