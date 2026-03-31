const Message = require('../models/Message.model');
const mongoose = require('mongoose');

// API 1: GET /:userID - Conversation history between Current User and userID
exports.getConversationHistory = async (req, res) => {
    try {
        const { userID } = req.params;
        const currentUserID = req.user._id;

        // $or: (from=currentUser AND to=userID) OR (from=userID AND to=currentUser)
        const messages = await Message.find({
            $or: [
                { from: currentUserID, to: userID },
                { from: userID, to: currentUserID }
            ]
        }).sort({ createdAt: 1 }); // Cũ đến mới

        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API 2: POST / - Send a new message (Text or File)
exports.sendMessage = async (req, res) => {
    try {
        // DEBUG: log body nhận được để kiểm tra
        console.log('[DEBUG] req.body:', req.body);
        console.log('[DEBUG] req.file:', req.file);

        const { to, text } = req.body;
        const from = req.user._id;
        let messageContent = {};

        if (req.file) {
            // Chuẩn hóa đường dẫn file (tránh lỗi backslash trên Windows)
            const filePath = req.file.path.replace(/\\/g, '/');
            messageContent = {
                type: 'file',
                text: filePath
            };
        } else {
            // Gửi tin nhắn text
            if (!text) {
                return res.status(400).json({ success: false, message: 'Nội dung tin nhắn (text) không được để trống.' });
            }
            messageContent = {
                type: 'text',
                text: text
            };
        }

        if (!to) {
            return res.status(400).json({ success: false, message: 'Thiếu trường "to" (người nhận).' });
        }

        const newMessage = new Message({ from, to, messageContent });
        await newMessage.save();

        res.status(201).json({
            success: true,
            data: newMessage
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// API 3: GET / - Inbox list (Latest message per conversation)
exports.getInboxList = async (req, res) => {
    try {
        const currentUserID = new mongoose.Types.ObjectId(req.user._id);

        const inbox = await Message.aggregate([
            {
                // Bước 1: Lọc tất cả tin nhắn có liên quan đến user hiện tại
                $match: {
                    $or: [{ from: currentUserID }, { to: currentUserID }]
                }
            },
            {
                // Bước 2: Sắp xếp mới nhất lên đầu (để $first lấy được tin mới nhất)
                $sort: { createdAt: -1 }
            },
            {
                // Bước 3: Tạo field "conversationKey" - cặp (UserA, UserB) chỉ có 1 nhóm duy nhất
                // dùng $min/$max để đảm bảo (A,B) và (B,A) cùng group
                $group: {
                    _id: {
                        user1: { $min: ['$from', '$to'] },
                        user2: { $max: ['$from', '$to'] }
                    },
                    lastMessage: { $first: '$$ROOT' }
                }
            },
            {
                // Bước 4: Xác định "người kia" trong hội thoại (không phải current user)
                $addFields: {
                    otherUser: {
                        $cond: [
                            { $eq: ['$lastMessage.from', currentUserID] },
                            '$lastMessage.to',
                            '$lastMessage.from'
                        ]
                    }
                }
            },
            {
                // Bước 5: Format output gọn gàng
                $project: {
                    _id: 0,
                    otherUser: 1,
                    lastMessage: 1
                }
            },
            {
                // Bước 6: Sắp xếp lại theo tin nhắn mới nhất
                $sort: { 'lastMessage.createdAt': -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            count: inbox.length,
            data: inbox
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

