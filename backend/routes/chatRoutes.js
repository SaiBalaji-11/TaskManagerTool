// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { handleChat } = require('../controllers/chatControllers');
const { verifyAccessToken } = require('../middlewares.js');

// Protect the route so only logged-in users can chat
router.post('/', verifyAccessToken, handleChat);

module.exports = router;