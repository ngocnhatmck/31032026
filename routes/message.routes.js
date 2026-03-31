const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const messageController = require('../controllers/message.controller');

const fs = require('fs');

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = './uploads/';
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath); // Store in /uploads folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // filename based on timestamp
    }
});

const upload = multer({ storage });

// Routes for the chat functionality

// ⚠️ IMPORTANT: GET / (inbox) must be BEFORE GET /:userID
// Otherwise Express will match "/" as userID="" with the wildcard route.

// GET / - Inbox list (Latest message for each user)
router.get('/', messageController.getInboxList);

// POST / - Send a message (Handle single file attachment with "file" key)
router.post('/', upload.single('file'), messageController.sendMessage);

// GET /:userID - Conversation history
router.get('/:userID', messageController.getConversationHistory);

module.exports = router;
