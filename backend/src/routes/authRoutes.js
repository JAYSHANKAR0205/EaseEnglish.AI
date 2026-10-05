const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { googleAuth, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  }
});

router.post('/google', authLimiter, googleAuth);
router.get('/me', protect, getMe);
router.post('/logout', logout);

module.exports = router;
