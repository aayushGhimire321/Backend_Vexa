import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';  // Import your auth routes
import userRoutes from './routes/user.js';
import projectRoutes from './routes/project.js';
import teamRoutes from './routes/teams.js';
import chatRoutes from './routes/chatRoutes.js';
import communityRoutes from './routes/communityRoutes.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import http from "http";
import { Server } from "socket.io";
import morgan from 'morgan';
import { createError } from './error.js';

dotenv.config();

console.log('MONGO_URL:', process.env.MONGO_URL);

const app = express();

/** Middlewares */
app.use(express.json());

/** CORS Configuration */
const corsConfig = {
    credentials: true,
    origin: process.env.NODE_ENV === 'production'
        ? process.env.CORS_ORIGIN || 'https://your-production-domain.com'
        : 'http://localhost:3000',
};

app.use(cors(corsConfig));

/** Other Middlewares */
app.use(morgan('tiny'));
app.use(cookieParser());
app.disable('x-powered-by');

/** MongoDB Connection */
const connect = () => {
    const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/Vexa';

    mongoose.set('strictQuery', true);
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1);
    });
};

/** Routes */
app.use('/api/v1/auth', authRoutes);  // Update route path to use /api/v1
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/project', projectRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/community', communityRoutes);

/** Global Error Handler */
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
    console.error(`Error: ${message}`);
    return res.status(status).json({
        success: false,
        status,
        message,
    });
});

// Setup Server with Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true },
});

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  socket.on("message", async (data) => {
    io.emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/** Start the Server */
app.listen(process.env.PORT || 5000, () => {
    console.log(`Server running on http://localhost:${process.env.PORT || 5000}`);
    connect();
});
