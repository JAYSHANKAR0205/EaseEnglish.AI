/**
 * Integration & End-to-End Verification Test
 * Tests live HTTP communication across:
 * Frontend Client -> Node.js Express Backend -> Python AI Service -> MongoDB Atlas
 */

const axios = require('axios');
const assert = require('assert');

const BACKEND_URL = 'http://127.0.0.1:5000';
const AI_SERVICE_URL = 'http://127.0.0.1:8000';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIntegrationVerification() {
  console.log('====================================================');
  console.log('Starting End-to-End Verification Suite for Ease English');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  function report(name, status, details = '') {
    if (status) {
      console.log(`[PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name} - ${details}`);
      failedCount++;
    }
  }

  // 1. Verify Python AI Service Health
  try {
    const aiHealth = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 4000 });
    report('1. Python AI Service is healthy on port 8000', aiHealth.status === 200 && aiHealth.data.status === 'healthy');
  } catch (err) {
    report('1. Python AI Service is healthy on port 8000', false, err.message);
  }

  // 2. Verify Node.js Backend Health
  try {
    const backendHealth = await axios.get(`${BACKEND_URL}/health`, { timeout: 4000 });
    report('2. Node.js Backend is healthy on port 5000', backendHealth.status === 200 && backendHealth.data.status === 'healthy');
  } catch (err) {
    report('2. Node.js Backend is healthy on port 5000', false, err.message);
  }

  let userAToken = null;
  let userBToken = null;
  let conversationId = null;

  // 3. Verify Authentication: User A Login
  try {
    const authRes = await axios.post(`${BACKEND_URL}/api/auth/google`, {
      isDevTest: true,
      name: 'Jayshankar Kumar',
      email: 'jayshankar.e2e@easeenglish.com'
    });
    userAToken = authRes.data.token;
    report('3. Google/Dev Authentication & JWT Issuance (User A)', Boolean(userAToken) && authRes.data.user.email === 'jayshankar.e2e@easeenglish.com');
  } catch (err) {
    report('3. Google/Dev Authentication & JWT Issuance (User A)', false, err.message);
  }

  // 4. Verify Authentication: User B Login
  try {
    const authResB = await axios.post(`${BACKEND_URL}/api/auth/google`, {
      isDevTest: true,
      name: 'Second User',
      email: 'second.user@easeenglish.com'
    });
    userBToken = authResB.data.token;
    report('4. Multi-user session creation (User B)', Boolean(userBToken));
  } catch (err) {
    report('4. Multi-user session creation (User B)', false, err.message);
  }

  // 5. Verify Protected Route: GET /api/auth/me
  try {
    const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    report('5. Session verification /api/auth/me', meRes.status === 200 && meRes.data.user.name === 'Jayshankar Kumar');
  } catch (err) {
    report('5. Session verification /api/auth/me', false, err.message);
  }

  // 6. Verify Unauthorized Access without Token
  try {
    await axios.get(`${BACKEND_URL}/api/auth/me`);
    report('6. Reject unauthenticated request to protected route', false, 'Should have returned 401');
  } catch (err) {
    report('6. Reject unauthenticated request to protected route', err.response && err.response.status === 401);
  }

  // 7. Verify Conversation Creation & Greeting Engine
  try {
    const convRes = await axios.post(
      `${BACKEND_URL}/api/conversations`,
      { level: 'intermediate', mode: 'chat', language: 'english' },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    conversationId = convRes.data.conversation._id;
    const initialGreeting = convRes.data.conversation.messages[0];
    report(
      '7. Create Conversation with Greeting Engine turn',
      Boolean(conversationId) && initialGreeting && initialGreeting.role === 'assistant' && initialGreeting.nextQuestion !== null
    );
  } catch (err) {
    report('7. Create Conversation with Greeting Engine turn', false, err.message);
  }

  // 8. Verify AI Turn: Meaningful English Mistake Correction
  try {
    const turnRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'I am working from two years as a developer.',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = turnRes.data.data;
    const hasCorrection = data.hasCorrection === true;
    const correctionMatches = data.correction && data.correction.toLowerCase().includes('for two years');
    const hasExplanation = Boolean(data.explanation);
    const hasFollowUp = Boolean(data.nextQuestion) && data.nextQuestion.includes('?');

    report(
      '8. AI Turn with meaningful English error (working from -> working for)',
      hasCorrection && correctionMatches && hasExplanation && hasFollowUp,
      `Correction: ${data.correction}`
    );
  } catch (err) {
    report('8. AI Turn with meaningful English error', false, err.message);
  }

  // 9. Verify AI Turn: Correct English is NOT falsely corrected
  try {
    const turnRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'I have been working as a software developer for two years.',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = turnRes.data.data;
    const noFalseCorrection = data.hasCorrection === false && data.correction === null;
    const hasResponse = Boolean(data.response);
    const hasFollowUp = Boolean(data.nextQuestion);

    report(
      '9. Correct English is NOT falsely corrected',
      noFalseCorrection && hasResponse && hasFollowUp
    );
  } catch (err) {
    report('9. Correct English is NOT falsely corrected', false, err.message);
  }

  // 10. Verify Gibberish Handling
  try {
    const gibberishRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'asdfghjkl qwerty',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = gibberishRes.data.data;
    const detected = data.inputQuality === 'gibberish';
    const noFakeCorrection = data.hasCorrection === false && data.correction === null;
    const friendlyRetry = Boolean(data.response) && (data.response.includes('catch') || data.response.includes('clearly') || data.response.includes('again'));

    report(
      '10. Gibberish handling returns friendly retry without fake correction',
      detected && noFakeCorrection && friendlyRetry,
      `Response: ${data.response}`
    );
  } catch (err) {
    report('10. Gibberish handling returns friendly retry', false, err.message);
  }

  // 11. Verify Security: Conversation Ownership Protection (User B cannot access User A's conversation)
  try {
    await axios.get(`${BACKEND_URL}/api/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${userBToken}` }
    });
    report('11. Security: Block cross-user conversation access', false, 'User B was improperly allowed access');
  } catch (err) {
    report('11. Security: Block cross-user conversation access', err.response && err.response.status === 403);
  }

  // 12. Verify Conversation Retrieval & Persistence in MongoDB
  try {
    const getRes = await axios.get(`${BACKEND_URL}/api/conversations/${conversationId}`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });
    const messages = getRes.data.conversation.messages;
    report(
      '12. Conversation messages and turns persisted in MongoDB',
      messages.length >= 4 && getRes.data.conversation.userId !== undefined,
      `Total messages in DB: ${messages.length}`
    );
  } catch (err) {
    report('12. Conversation messages and turns persisted in MongoDB', false, err.message);
  }

  // 13. Verify New Chat creates fresh conversation without deleting prior one
  try {
    const newChatRes = await axios.post(
      `${BACKEND_URL}/api/conversations`,
      { level: 'advanced', mode: 'voice', language: 'english' },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const newChatId = newChatRes.data.conversation._id;

    // Verify both conversations exist in history list
    const listRes = await axios.get(`${BACKEND_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${userAToken}` }
    });

    const ids = listRes.data.conversations.map((c) => c.id);
    const bothExist = ids.includes(conversationId) && ids.includes(newChatId);

    report(
      '13. New Chat creates fresh session while keeping prior history',
      bothExist && newChatId !== conversationId,
      `History count: ${listRes.data.conversations.length}`
    );
  } catch (err) {
    report('13. New Chat creates fresh session while keeping prior history', false, err.message);
  }

  // 14. Verify Identity Protection & Learning Anxiety Empathy ('i am fearing about english')
  try {
    const fearRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'i am fearing about english',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = fearRes.data.data;
    const noBogusName = !data.response.includes('Fearing About');
    const hasCorrection = data.hasCorrection === true;
    const correctionMatches = data.correction && data.correction.toLowerCase().includes('worried about');
    const isEmpathetic = data.response.toLowerCase().includes('nervous') || data.response.toLowerCase().includes('worried') || data.response.toLowerCase().includes('confidence');

    report(
      '14. Identity protection & anxiety empathy: "i am fearing about english" does not invent name and corrects word choice',
      noBogusName && hasCorrection && correctionMatches && isEmpathetic,
      `Response: ${data.response} | Correction: ${data.correction}`
    );
  } catch (err) {
    report('14. Identity protection & anxiety empathy', false, err.message);
  }

  // 15. Verify Context Recall Across Turns ('What did I say I work with?')
  try {
    // First, user mentions tech in this conversation
    await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'I mostly work with React and building interfaces.',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );

    // Then asks what they said they work with
    const recallRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'What did I say I work with?',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = recallRes.data.data;
    const recallsReact = data.response.includes('React');
    const noRepeatedGreeting = !data.response.toLowerCase().includes('pleasure to meet you') && !data.response.toLowerCase().includes('nice to meet you');

    report(
      '15. Context recall across turns: AI recalls React from earlier turns without session greeting',
      recallsReact && noRepeatedGreeting,
      `Response: ${data.response}`
    );
  } catch (err) {
    report('15. Context recall across turns', false, err.message);
  }

  // 16. Verify Out-of-Context Number Handling ("65"): AI must NOT give fake praise or invent meaning
  try {
    const numRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: '65',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = numRes.data.data;
    const noFakePraise = !data.response.toLowerCase().includes('clear and understandable') && !data.response.toLowerCase().includes('expressing your ideas');
    const asksClarification = data.response.toLowerCase().includes('connect') || data.response.toLowerCase().includes('mean') || data.response.toLowerCase().includes('sure') || data.response.toLowerCase().includes('clarify');
    const noFakeCorrection = data.hasCorrection === false;

    report(
      '16. Comprehension: Out-of-context number "65" rejects fake praise and asks natural clarification',
      noFakePraise && asksClarification && noFakeCorrection,
      `Response: ${data.response}`
    );
  } catch (err) {
    report('16. Comprehension: Out-of-context number "65"', false, err.message);
  }

  // 17. Verify Incomplete Sentence Handling ("I work in")
  try {
    const incompRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'I work in',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = incompRes.data.data;
    const noFakePraise = !data.response.toLowerCase().includes('clear and understandable');
    const promptsCompletion = data.response.toLowerCase().includes('incomplete') || (data.nextQuestion && data.nextQuestion.toLowerCase().includes('complete'));
    const noFakeCorrection = data.hasCorrection === false;

    report(
      '17. Comprehension: Incomplete sentence "I work in" prompts completion without fake praise',
      noFakePraise && promptsCompletion && noFakeCorrection,
      `Response: ${data.response} | Question: ${data.nextQuestion}`
    );
  } catch (err) {
    report('17. Comprehension: Incomplete sentence "I work in"', false, err.message);
  }

  // 18. Verify Topic Change Handling ("I want to improve my pronunciation.")
  try {
    const topicRes = await axios.post(
      `${BACKEND_URL}/api/ai/conversation`,
      {
        conversationId,
        message: 'I want to improve my pronunciation.',
        level: 'intermediate',
        mode: 'chat',
        language: 'english'
      },
      { headers: { Authorization: `Bearer ${userAToken}` } }
    );
    const data = topicRes.data.data;
    const embracesTopic = data.response.toLowerCase().includes('pronunciation');

    report(
      '18. Comprehension: User topic change "I want to improve my pronunciation" embraced smoothly',
      embracesTopic,
      `Response: ${data.response}`
    );
  } catch (err) {
    report('18. Comprehension: User topic change', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`Results: ${passedCount} PASSED, ${failedCount} FAILED out of ${passedCount + failedCount} tests`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runIntegrationVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
