const axios = require('axios');
const Conversation = require('../models/Conversation');
const { PYTHON_AI_SERVICE_URL } = require('../config/env');

/**
 * Derives a clean conversation title from the first user topic
 */
const deriveConversationTitle = (message) => {
  const cleaned = message.replace(/[^\w\s]/gi, '').trim();
  const words = cleaned.split(/\s+/);
  if (words.length <= 6) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return words.slice(0, 5).join(' ') + '...';
};

/**
 * @route   POST /api/ai/conversation
 * @desc    Process a conversation turn through Python AI service and persist to MongoDB
 * @access  Private
 */
exports.handleConversation = async (req, res, next) => {
  try {
    const { conversationId, message, level = 'intermediate', mode = 'chat', language = 'english' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message text cannot be empty.'
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        error: 'conversationId is required.'
      });
    }

    // Verify conversation ownership
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found.'
      });
    }

    if (conversation.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access to this conversation.'
      });
    }

    // Build history for controlled context window (last 20 messages / 10 turns)
    const historyPayload = conversation.messages.slice(-20).map((msg) => {
      let content = msg.transcript || msg.response || '';
      if (msg.role === 'assistant' && msg.nextQuestion) {
        content = `${msg.response || msg.transcript || ''} ${msg.nextQuestion}`.trim();
      }
      return {
        role: msg.role,
        transcript: content,
        response: msg.response || msg.transcript,
        has_correction: msg.hasCorrection,
        correction: msg.correction,
        explanation: msg.explanation,
        next_question: msg.nextQuestion
      };
    });

    // Forward to Python AI microservice
    const aiServiceUrl = `${PYTHON_AI_SERVICE_URL}/ai/conversation`;
    const aiResponse = await axios.post(aiServiceUrl, {
      user_id: req.user._id.toString(),
      user_name: req.user.name,
      message: message.trim(),
      level: level.toLowerCase(),
      mode: mode.toLowerCase(),
      language: language.toLowerCase(),
      conversation_history: historyPayload
    });

    const aiData = aiResponse.data;

    // Persist User Turn
    conversation.messages.push({
      role: 'user',
      transcript: message.trim(),
      timestamp: new Date()
    });

    // Persist Assistant Turn (only if not empty speech)
    if (aiData.input_quality !== 'empty') {
      conversation.messages.push({
        role: 'assistant',
        transcript: aiData.response,
        hasCorrection: Boolean(aiData.has_correction),
        correction: aiData.correction || null,
        explanation: aiData.explanation || null,
        errorType: aiData.error_type || null,
        response: aiData.response,
        nextQuestion: aiData.next_question || null,
        fastPath: Boolean(aiData.fast_path),
        timestamp: new Date()
      });
    }

    // If title is default and user has spoken, generate context-specific title
    if (
      conversation.title === 'English Conversation Practice' &&
      aiData.input_quality === 'valid'
    ) {
      conversation.title = deriveConversationTitle(message);
    }

    conversation.level = level;
    conversation.mode = mode;
    await conversation.save();

    return res.status(200).json({
      success: true,
      data: {
        inputQuality: aiData.input_quality,
        transcript: aiData.transcript,
        hasCorrection: aiData.has_correction,
        correction: aiData.correction,
        explanation: aiData.explanation,
        errorType: aiData.error_type || null,
        response: aiData.response,
        nextQuestion: aiData.next_question,
        difficulty: aiData.difficulty,
        fastPath: aiData.fast_path,
        audioBase64: aiData.audio_base64 || null
      }
    });
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        error: 'AI service is temporarily unavailable. Please verify the Python AI service is running.'
      });
    }
    next(err);
  }
};

/**
 * @route   POST /api/ai/transcribe
 * @desc    Proxy STT requests to Python AI Service
 * @access  Private
 */
exports.transcribe = async (req, res, next) => {
  try {
    const { audio_base64, mime_type } = req.body;
    const response = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/transcribe`, {
      audio_base64,
      mime_type
    });
    return res.status(200).json({
      success: true,
      transcript: response.data.transcript
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   POST /api/ai/synthesize
 * @desc    Proxy TTS requests to Python AI Service
 * @access  Private
 */
exports.synthesize = async (req, res, next) => {
  try {
    const { text, voice_name } = req.body;
    const response = await axios.post(`${PYTHON_AI_SERVICE_URL}/ai/synthesize`, {
      text,
      voice_name
    });
    return res.status(200).json({
      success: true,
      audioBase64: response.data.audio_base64
    });
  } catch (err) {
    next(err);
  }
};
