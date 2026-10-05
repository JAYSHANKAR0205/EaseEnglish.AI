const express = require('express');
const router = express.Router();
const {
  createConversation,
  getConversations,
  getConversationById,
  deleteConversation
} = require('../controllers/conversationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All conversation routes require authentication

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversationById);
router.delete('/:id', deleteConversation);

module.exports = router;
