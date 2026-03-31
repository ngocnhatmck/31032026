require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const messageRoutes = require('./routes/message.routes');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/chat_app";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mock User Authentication Middleware (Dummy userID for testing)
app.use((req, res, next) => {
    // In actual production, you would fetch the user from a token (JWT).
    // Here we provide a static object to avoid errors while testing.
    req.user = { _id: "6600a0000000000000000001" }; // User Current ID
    next();
});

// Use Message Routes
app.use('/api/messages', messageRoutes);

// MongoDB connection
mongoose.connect(DB_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully.'))
    .catch((err) => console.error('❌ MongoDB connection error:', err));

app.listen(PORT, () => {
    console.log(`🚀 Chat API server running on http://localhost:${PORT}`);
});
