const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { handleConversation, transcribe, synthesize } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 turns per minute limit
  message: {
    success: false,
    error: 'Too many requests. Please slow down.'
  }
});

router.use(protect); // All AI conversation routes require authentication

router.post('/conversation', aiLimiter, handleConversation);
router.post('/transcribe', aiLimiter, transcribe);
router.post('/synthesize', aiLimiter, synthesize);

module.exports = router;
