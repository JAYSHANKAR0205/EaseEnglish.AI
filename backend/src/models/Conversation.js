const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    transcript: {
      type: String,
      required: true
    },
    hasCorrection: {
      type: Boolean,
      default: false
    },
    correction: {
      type: String,
      default: null
    },
    explanation: {
      type: String,
      default: null
    },
    errorType: {
      type: String,
      default: null
    },
    response: {
      type: String,
      default: null
    },
    nextQuestion: {
      type: String,
      default: null
    },
    fastPath: {
      type: Boolean,
      default: false
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'English Conversation Practice',
      trim: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    mode: {
      type: String,
      enum: ['chat', 'voice'],
      default: 'chat'
    },
    language: {
      type: String,
      enum: ['english', 'hindi'],
      default: 'english'
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

// Compound index for fast retrieval of user conversation history ordered by last active
conversationSchema.index({ userId: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
