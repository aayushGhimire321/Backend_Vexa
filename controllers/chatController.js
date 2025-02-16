import Chat from "../models/Chat.js";

// Fetch all messages
export const getMessages = async (req, res) => {
  try {
    const messages = await Chat.find().sort({ createdAt: 1 }).populate("sender", "name email");
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { sender, message } = req.body;
    if (!sender || !message) return res.status(400).json({ error: "Sender and message are required" });

    const newMessage = new Chat({ sender, message });
    await newMessage.save();

    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
};
