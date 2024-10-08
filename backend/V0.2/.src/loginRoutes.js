const express = require('express');
const cookieParser = require('cookie-parser');
const responseFormatter = require('../middleware/responseHandler'); // Import middleware

const router = express.Router();

router.use(cookieParser());
router.use(responseFormatter);

// Login Route
router.post('/login', login);

// Logout Route
router.post('/logout', logout);

module.exports = router;
