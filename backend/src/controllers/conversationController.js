const axios = require('axios');
const Conversation = require('../models/Conversation');
const { PYTHON_AI_SERVICE_URL } = require('../config/env');

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation session with greeting
 * @access  Private
 */
exports.createConversation = async (req, res, next) => {
  try {
    const { level = 'intermediate', mode = 'chat', language = 'english' } = req.body;
    const userId = req.user._id;

    // Check if user has prior conversations to know if they are returning
    const priorCount = await Conversation.countDocuments({ userId });
    const isReturning = priorCount > 0;

    // Call Python AI Service greeting engine
    let initialGreeting = "Hello! Welcome to Ease English. Could you introduce yourself briefly?";
    let openingQuestion = "Could you give me a brief introduction about yourself?";

    try {
      const aiGreetingRes = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/greeting`, {
        user_id: userId.toString(),
        user_name: req.user.name,
        level,
        is_returning: isReturning,
        language
      });
      if (aiGreetingRes.data && aiGreetingRes.data.full_message) {
        initialGreeting = aiGreetingRes.data.full_message;
        openingQuestion = aiGreetingRes.data.opening_question;
      }
    } catch (err) {
      console.warn(`[Greeting API warning]: Could not reach Python AI greeting engine: ${err.message}`);
    }

    // Persist conversation and initial greeting turn in MongoDB
    const conversation = await Conversation.create({
      userId,
      level,
      mode,
      language,
      title: 'English Conversation Practice',
      messages: [
        {
          role: 'assistant',
          transcript: initialGreeting,
          response: initialGreeting,
          nextQuestion: openingQuestion,
          fastPath: true,
          timestamp: new Date()
        }
      ]
    });

    return res.status(201).json({
      success: true,
      conversation
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/conversations
 * @desc    Get user's past conversations ordered by last active
 * @access  Private
 */
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title level mode language createdAt updatedAt messages')
      .lean();

    // Map to lightweight summary objects for history sidebar
    const historyList = conversations.map((conv) => {
      const lastMessage = conv.messages && conv.messages.length > 0
        ? conv.messages[conv.messages.length - 1]
        : null;

      return {
        id: conv._id,
        title: conv.title,
        level: conv.level,
        mode: conv.mode,
        language: conv.language,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messageCount: conv.messages ? conv.messages.length : 0,
        lastSnippet: lastMessage ? (lastMessage.transcript || lastMessage.response || '') : ''
      };
    });

    return res.status(200).json({
      success: true,
      conversations: historyList
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/conversations/:id
 * @desc    Get single conversation by ID with complete message history
 * @access  Private
 */
exports.getConversationById = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.'
      });
    }

    // Strict ownership verification
    if (conversation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this conversation.'
      });
    }

    return res.status(200).json({
      success: true,
      conversation
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete a conversation
 * @access  Private
 */
exports.deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.'
      });
    }

    if (conversation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized.'
      });
    }

    await Conversation.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Conversation removed successfully.'
    });
  } catch (err) {
    next(err);
  }
};
