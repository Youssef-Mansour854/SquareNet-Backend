const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

dotenv.config({ path: "config.env" });

const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/errorMiddleware");
const dbConnection = require("./config/database");
const categoryRoute = require("./routes/categoryRoute");
const propertyRoute = require("./routes/propertyRoute");
const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const wishlistRoute = require("./routes/wishlistRoute");
const messageRoute = require("./routes/messageRoute");
const reviewRoute = require("./routes/reviewRoute");
const notificationRoute = require("./routes/notificationRoute");
const chatRoute = require("./routes/chatRoute");
const adminRoute = require("./routes/adminRoute");
const cors = require("cors");

dbConnection();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Track online users: userId -> socketId
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`User connected to socket: ${socket.id}`);

  // Register user as online
  socket.on("register_user", (userId) => {
    onlineUsers.set(userId, socket.id);
    // Broadcast to all clients that this user is online
    io.emit("user_online", userId);
    // لكل عميل جديد: قائمة بكل المستخدمين المتصلين حالياً (حتى يظهر «نشط» بدون إعادة اتصال الطرف الآخر)
    socket.emit("online_users_list", Array.from(onlineUsers.keys()));
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // User joins a specific conversation room
  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined conversation: ${conversationId}`);
  });

  // Typing indicator
  socket.on("typing", (data) => {
    // data: { conversationId, userId, userName }
    socket.to(data.conversationId).emit("user_typing", {
      userId: data.userId,
      userName: data.userName,
      isTyping: true,
    });
  });

  socket.on("stop_typing", (data) => {
    socket.to(data.conversationId).emit("user_typing", {
      userId: data.userId,
      userName: data.userName,
      isTyping: false,
    });
  });

  // Handle incoming message
  socket.on("send_message", async (data) => {
    try {
      const ChatMessage = require("./models/ChatMessageModel");
      const Conversation = require("./models/ConversationModel");
      const { createNotification } = require("./controllers/notificationController");

      // Save to database
      const newMsg = await ChatMessage.create({
        conversationId: data.conversationId,
        sender: data.senderId,
        text: data.text,
      });

      // Update conversation's last message
      await Conversation.findByIdAndUpdate(data.conversationId, {
        lastMessage: newMsg._id,
      });

      // Increment unread count for other participants
      const conversation = await Conversation.findById(data.conversationId);
      if (conversation) {
        if (!conversation.unreadCount) {
          conversation.unreadCount = new Map();
        }
        for (const participantId of conversation.participants) {
          if (participantId.toString() !== data.senderId) {
            const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
            conversation.unreadCount.set(participantId.toString(), currentCount + 1);
          }
        }
        try {
          await conversation.save();
        } catch (saveErr) {
          console.error("Error saving conversation unread count:", saveErr);
        }
      }

      // Populate sender info for the frontend
      const populatedMsg = await newMsg.populate("sender", "name profileImg role");

      // Create notification for the other participant
      try {
        if (conversation) {
          const recipientId = conversation.participants.find(
            (p) => p.toString() !== data.senderId
          );
          if (recipientId) {
            const { createNotification } = require("./controllers/notificationController");
            await createNotification({
              recipient: recipientId,
              type: "new_message",
              title: `رسالة جديدة من ${populatedMsg.sender?.name || "مستخدم"}`,
              body: data.text.length > 60 ? data.text.substring(0, 60) + "..." : data.text,
              sender: data.senderId,
            });
          }
        }
      } catch (notifErr) {
        console.error("Error creating notification:", notifErr);
      }

      // Broadcast to the conversation room
      io.to(data.conversationId).emit("receive_message", populatedMsg);
    } catch (error) {
      console.error("Socket send_message error:", error);
    }
  });

  // Handle message edit
  socket.on("edit_message", async (data) => {
    try {
      const ChatMessage = require("./models/ChatMessageModel");
      const { messageId, text, senderId } = data;

      const message = await ChatMessage.findById(messageId);
      if (!message) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      if (message.sender.toString() !== senderId) {
        socket.emit("error", { message: "Not authorized" });
        return;
      }

      message.text = text.trim();
      message.isEdited = true;
      await message.save();

      const populatedMsg = await ChatMessage.findById(messageId).populate("sender", "name profileImg");

      io.to(data.conversationId).emit("message_edited", {
        messageId: populatedMsg._id,
        text: populatedMsg.text,
        isEdited: true,
        conversationId: data.conversationId,
      });
    } catch (error) {
      console.error("Socket edit_message error:", error);
    }
  });

  // Handle message delete
  socket.on("delete_message", async (data) => {
    try {
      const ChatMessage = require("./models/ChatMessageModel");
      const { messageId, senderId } = data;

      const message = await ChatMessage.findById(messageId);
      if (!message) {
        socket.emit("error", { message: "Message not found" });
        return;
      }

      if (message.sender.toString() !== senderId) {
        socket.emit("error", { message: "Not authorized" });
        return;
      }

      message.isDeleted = true;
      message.text = "تم حذف هذه الرسالة";
      await message.save();

      io.to(data.conversationId).emit("message_deleted", {
        messageId,
        text: "تم حذف هذه الرسالة",
        isDeleted: true,
        conversationId: data.conversationId,
      });
    } catch (error) {
      console.error("Socket delete_message error:", error);
    }
  });

  // Handle mark as read via socket
  socket.on("mark_read", async (data) => {
    try {
      const ChatMessage = require("./models/ChatMessageModel");
      const Conversation = require("./models/ConversationModel");
      const { conversationId, userId } = data;

      if (!conversationId || !userId) return;

      await ChatMessage.updateMany(
        { conversationId, sender: { $ne: userId }, isRead: false, isDeleted: false },
        { isRead: true }
      );

      const conversation = await Conversation.findById(conversationId);
      if (conversation) {
        if (!conversation.unreadCount) {
          conversation.unreadCount = new Map();
        }
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();
      }

      socket.to(data.conversationId).emit("messages_read", {
        readerId: userId,
        conversationId,
      });
    } catch (error) {
      console.error("Socket mark_read error:", error);
    }
  });

  socket.on("disconnect", () => {
    try {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          io.emit("user_offline", userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    } catch (error) {
      console.error("Socket disconnect error:", error);
    }
    console.log(`User disconnected from socket: ${socket.id}`);
  });
});

// Set Security HTTP Headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors());

// Limit data size to 20kb to prevent payload DOS
app.use(express.json({ limit: "20kb" }));

// Prevent HTTP Parameter Pollution
app.use(
  hpp({
    // whitelist: ['price', 'sold', 'quantity', 'ratingsAverage', 'ratingsQuantity'],
  })
);

// Limit requests from same API (Brute Force Protection)
const limiter = rateLimit({
  max: 100,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: "Too many requests from this IP, please try again after 15 minutes",
});
app.use("/api", limiter);

app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "SquareNet API is running",
  });
});

app.use("/api/v1/categories", categoryRoute);
app.use("/api/v1/properties", propertyRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/wishlist", wishlistRoute);
app.use("/api/v1/messages", messageRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/notifications", notificationRoute);
app.use("/api/v1/chat", chatRoute);
app.use("/api/v1/admin", adminRoute);

app.all(/^(.*)$/, (req, res, next) => {
  next(new ApiError(`Can't find this route: ${req.originalUrl}`, 404));
});

app.use(globalError);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled rejection: ${err.name} | ${err.message}`);
  // Don't crash server for non-critical errors
});
