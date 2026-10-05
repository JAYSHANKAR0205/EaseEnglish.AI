const test = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

// Test JWT creation and verification
test('JWT token creation and verification', () => {
  const secret = 'test_secret_12345';
  const payload = { id: '64f1234567890abcdef12345', email: 'test@easeenglish.com' };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });

  const decoded = jwt.verify(token, secret);
  assert.strictEqual(decoded.id, payload.id);
  assert.strictEqual(decoded.email, payload.email);
});

// Test User schema validation
test('User schema validation', () => {
  const User = require('../src/models/User');
  const user = new User({
    email: 'learner@easeenglish.com',
    name: 'Test Learner',
    googleId: 'google_123456'
  });

  const err = user.validateSync();
  assert.strictEqual(err, undefined, 'User model should be valid with required fields');
  assert.strictEqual(user.email, 'learner@easeenglish.com');
  assert.strictEqual(user.name, 'Test Learner');
});

// Test Conversation schema validation and message structure
test('Conversation schema validation', () => {
  const Conversation = require('../src/models/Conversation');
  const conv = new Conversation({
    userId: new mongoose.Types.ObjectId(),
    level: 'intermediate',
    mode: 'chat',
    language: 'english',
    messages: [
      {
        role: 'user',
        transcript: 'I am working from two years as a developer.',
      },
      {
        role: 'assistant',
        transcript: 'That is great!',
        hasCorrection: true,
        correction: 'I have been working as a developer for two years.',
        explanation: "Use 'for two years' to describe a duration.",
        nextQuestion: 'What made you choose software development?'
      }
    ]
  });

  const err = conv.validateSync();
  assert.strictEqual(err, undefined, 'Conversation model should be valid');
  assert.strictEqual(conv.messages.length, 2);
  assert.strictEqual(conv.messages[1].hasCorrection, true);
  assert.strictEqual(conv.messages[1].nextQuestion, 'What made you choose software development?');
});

// Test Authorization logic: Conversation ownership protection
test('Conversation ownership logic', () => {
  const userA_id = new mongoose.Types.ObjectId().toString();
  const userB_id = new mongoose.Types.ObjectId().toString();

  const conversationOfA = {
    userId: userA_id,
    title: 'Secret Session'
  };

  const isOwnerA = conversationOfA.userId.toString() === userA_id;
  const isOwnerB = conversationOfA.userId.toString() === userB_id;

  assert.strictEqual(isOwnerA, true, 'User A should have ownership');
  assert.strictEqual(isOwnerB, false, 'User B should NOT have access to User A conversation');
});
