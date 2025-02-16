import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import projectRoutes from './routes/project.js';
import teamRoutes from './routes/teams.js';
import cookieParser from 'cookie-parser';
import chatRoutes from './routes/chatRoutes.js';
import cors from 'cors';
import morgan from 'morgan';

dotenv.config();

console.log('MONGO_URL:', process.env.MONGO_URL); // Debug log for MONGO_URL

const app = express();

/** Middlewares */
app.use(express.json());

/** CORS Configuration */
const corsConfig = {
    credentials: true,
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.CORS_ORIGIN || 'https://your-production-domain.com' // Change this to your production URL
        : 'http://localhost:3000', // Default to localhost in development
};

app.use(cors(corsConfig));

/** Other Middlewares */
app.use(morgan('tiny'));
app.use(cookieParser());
app.disable('x-powered-by');

/** Port */
const port = process.env.PORT || 8700;

/** MongoDB Connection */
const connect = () => {
    const mongoURI = process.env.MONGO_URL || 'mongodb://localhost:27017/Vexa'; // Use the environment variable if provided

    mongoose.set('strictQuery', true);
    mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        process.exit(1); // Exit process with failure
    });
};

/** Routes */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/chat', chatRoutes);

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

/** Start the Server */
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    connect();
});
