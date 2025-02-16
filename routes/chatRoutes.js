import express from "express";
import Chat from "../models/Chat.js";  // Import Chat Model

const router = express.Router();

// Get all messages
router.get("/messages", async (req, res) => {
    try {
        const messages = await Chat.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving messages" });
    }
});

// Send a new message
router.post("/message", async (req, res) => {
    const { sender, message } = req.body;
    try {
        const newMessage = new Chat({ sender, message });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ message: "Error saving message" });
    }
});

export default router;
