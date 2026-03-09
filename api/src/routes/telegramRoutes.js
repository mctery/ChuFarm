const express = require('express');
const { webhook } = require('../controllers/telegramController');

const router = express.Router();

// Telegram webhook — no auth (called by Telegram servers)
router.post('/webhook', webhook);

module.exports = router;
