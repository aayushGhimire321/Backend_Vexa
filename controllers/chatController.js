import Chat from "../models/Chat.js";
import User from "../models/User.js";

// Fetch all messages with sender details
export const getMessages = async (req, res) => {
  try {
    const messages = await Chat.find().sort({ createdAt: 1 }).populate("sender", "name email");
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Send a new message with validation and user existence check
export const sendMessage = async (req, res) => {
  try {
    const { sender, message } = req.body;

    if (!sender || !message) {
      return res.status(400).json({ error: "Sender and message are required" });
    }

    // Check if the sender exists in the User model
    const senderUser = await User.findById(sender);
    if (!senderUser) {
      return res.status(404).json({ error: "Sender user not found" });
    }

    // Create a new chat message
    const newMessage = new Chat({
      sender,
      message,
    });

    // Save the message to the database
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Fetch messages for a specific user (Optional)
export const getUserMessages = async (req, res) => {
  const userId = req.params.userId;

  try {
    const messages = await Chat.find({ sender: userId }).sort({ createdAt: 1 }).populate("sender", "name email");
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages for user" });
  }
};
