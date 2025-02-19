// db.js (or wherever you keep your database connection logic)
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Check if LOCAL_DATABASE_URI is defined
        if (!process.env.LOCAL_DATABASE_URI) {
            console.error("Missing LOCAL_DATABASE_URI environment variable");
            process.exit(1); // Exit process with failure if the URI is missing
        }

        // Connect to the MongoDB database
        const conn = await mongoose.connect(process.env.LOCAL_DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Success message if the connection is successful
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        // Log and exit on error
        console.error(`Error: ${err.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;
