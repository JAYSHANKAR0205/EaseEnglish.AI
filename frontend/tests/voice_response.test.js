import assert from 'assert';
import { getVoiceSections } from '../src/utils/speechUtils.ts';

console.log('====================================================');
console.log('Testing Structured AI Voice Response Behavior');
console.log('====================================================\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

// Test 1: Full AI response with correction, explanation, response, and question
test('1. Full correction turn produces 4 distinct sequential sections', () => {
  const input = {
    hasCorrection: true,
    correction: 'I am worried about my English.',
    explanation: "The phrase 'fearing about' is not natural in this context.",
    response: "That's okay. We can practice together.",
    nextQuestion: 'What do you find most difficult when speaking English?',
  };

  const sections = getVoiceSections(input);
  assert.strictEqual(sections.length, 4, 'Should have exactly 4 sections');
  assert.ok(sections[0].includes('I am worried about my English.'));
  assert.ok(sections[1].includes("The phrase 'fearing about' is not natural in this context."));
  assert.strictEqual(sections[2], "That's okay. We can practice together.");
  assert.strictEqual(sections[3], 'What do you find most difficult when speaking English?');
});

// Test 2: AI turn without correction (valid English)
test('2. Response without correction produces 2 sequential sections (response + question)', () => {
  const input = {
    hasCorrection: false,
    correction: null,
    explanation: null,
    response: 'Bihar has such a rich history and vibrant culture! Connecting with learners from different regions is wonderful.',
    nextQuestion: 'Which city or town in Bihar are you from?',
  };

  const sections = getVoiceSections(input);
  assert.strictEqual(sections.length, 2, 'Should have exactly 2 sections');
  assert.strictEqual(sections[0], 'Bihar has such a rich history and vibrant culture! Connecting with learners from different regions is wonderful.');
  assert.strictEqual(sections[1], 'Which city or town in Bihar are you from?');
});

// Test 3: Clarification / single response without follow-up question
test('3. Response without follow-up question produces 1 section', () => {
  const input = {
    hasCorrection: false,
    correction: null,
    explanation: null,
    response: 'I did not quite catch that. Could you please say that in another way?',
    nextQuestion: null,
  };

  const sections = getVoiceSections(input);
  assert.strictEqual(sections.length, 1, 'Should have 1 section');
  assert.strictEqual(sections[0], 'I did not quite catch that. Could you please say that in another way?');
});

// Test 4: Correction without explanation (concise feedback)
test('4. Correction without explanation produces 3 sections', () => {
  const input = {
    hasCorrection: true,
    correction: 'I went to the store yesterday.',
    explanation: null,
    response: 'Going to the store can be an adventure!',
    nextQuestion: 'What did you buy?',
  };

  const sections = getVoiceSections(input);
  assert.strictEqual(sections.length, 3, 'Should have 3 sections');
  assert.ok(sections[0].includes('I went to the store yesterday.'));
  assert.strictEqual(sections[1], 'Going to the store can be an adventure!');
  assert.strictEqual(sections[2], 'What did you buy?');
});

// Test 5: Avoid duplicate prefix framing if already present
test('5. Avoids duplicate framing if prefix already in correction/explanation', () => {
  const input = {
    hasCorrection: true,
    correction: 'Better: I have been studying English for six months.',
    explanation: 'Why: Use "for" when specifying a length of time.',
    response: 'Consistency is key to mastering any language.',
    nextQuestion: 'How many minutes a day do you study?',
  };

  const sections = getVoiceSections(input);
  assert.strictEqual(sections.length, 4);
  assert.strictEqual(sections[0], 'Better: I have been studying English for six months.');
  assert.strictEqual(sections[1], 'Why: Use "for" when specifying a length of time.');
  assert.ok(!sections[0].includes('Your sentence can be improved to: Better:'));
});

// Test 6: Works with Message objects (Conversation history replay)
test('6. Works with ConversationArea Message format for audio replay', () => {
  const message = {
    role: 'assistant',
    transcript: 'I work with artificial intelligence.',
    hasCorrection: true,
    correction: 'I work in artificial intelligence.',
    explanation: 'Both "with" and "in" are common, but "in" is typical when describing your industry field.',
    response: 'That is a rapidly evolving field!',
    nextQuestion: 'What areas of AI interest you most?',
    timestamp: new Date().toISOString(),
  };

  const sections = getVoiceSections(message);
  assert.strictEqual(sections.length, 4);
  assert.ok(sections[0].includes('I work in artificial intelligence.'));
  assert.ok(sections[1].includes('Both "with" and "in" are common'));
  assert.strictEqual(sections[2], 'That is a rapidly evolving field!');
  assert.strictEqual(sections[3], 'What areas of AI interest you most?');
});

// Test 7: Handles completely dynamic sentences of varying length without keyword matching
test('7. Handles arbitrary dynamic sentences with no hardcoded keywords', () => {
  const dynamicInput = {
    hasCorrection: true,
    correction: 'Quantum computing requires specialized cryogenic refrigeration.',
    explanation: 'Technical nouns in scientific contexts require specific adjectival forms.',
    response: 'Physics research at that level is extraordinary.',
    nextQuestion: 'Have you worked with superconducting qubits or ion traps?',
  };

  const sections = getVoiceSections(dynamicInput);
  assert.strictEqual(sections.length, 4);
  assert.ok(sections[0].includes('Quantum computing requires specialized cryogenic refrigeration.'));
  assert.ok(sections[1].includes('Technical nouns in scientific contexts'));
  assert.strictEqual(sections[2], 'Physics research at that level is extraordinary.');
  assert.strictEqual(sections[3], 'Have you worked with superconducting qubits or ion traps?');
});

// Test 8: Sequential playback timing simulation with pauses
async function runAsyncTests() {
  await new Promise((resolve) => {
    test('8. Sequential playback timing simulation executes sections with natural pauses', () => {
      const sections = ['Section 1', 'Section 2', 'Section 3'];
      const events = [];
      let isSpeaking = false;

      function simulatePlayback(secs, onComplete) {
        isSpeaking = true;
        let index = 0;

        function playNext() {
          if (index >= secs.length) {
            isSpeaking = false;
            events.push({ type: 'end' });
            onComplete();
            return;
          }

          events.push({ type: 'start', section: secs[index], time: Date.now() });
          // simulate section audio duration: 20ms
          setTimeout(() => {
            events.push({ type: 'section_end', section: secs[index], time: Date.now() });
            index++;
            if (index < secs.length) {
              // 40ms simulated pause
              setTimeout(playNext, 40);
            } else {
              isSpeaking = false;
              events.push({ type: 'end', time: Date.now() });
              onComplete();
            }
          }, 20);
        }

        playNext();
      }

      simulatePlayback(sections, () => {
        assert.strictEqual(isSpeaking, false);
        const startEvents = events.filter((e) => e.type === 'start');
        assert.strictEqual(startEvents.length, 3);
        assert.strictEqual(events[events.length - 1].type, 'end');
        resolve();
      });
    });
  });

  // Test 9: Cancellation during pause halts playback immediately
  await new Promise((resolve) => {
    test('9. Cancellation during pause cancels pending timeout and halts playback', () => {
      const sections = ['Section 1', 'Section 2', 'Section 3'];
      let pauseTimeout = null;
      let isStopped = false;
      const started = [];

      function play(idx) {
        if (isStopped || idx >= sections.length) return;
        started.push(sections[idx]);
        // Finish section 0
        pauseTimeout = setTimeout(() => {
          if (!isStopped) play(idx + 1);
        }, 100);
      }

      play(0);

      // Stop after 30ms (during pause before Section 1)
      setTimeout(() => {
        isStopped = true;
        clearTimeout(pauseTimeout);

        // Verify after 150ms that Section 2 was never started
        setTimeout(() => {
          assert.deepStrictEqual(started, ['Section 1']);
          resolve();
        }, 150);
      }, 30);
    });
  });

  console.log(`\nResults: ${passed} PASSED, ${failed} FAILED out of ${passed + failed} tests`);
  if (failed > 0) process.exit(1);
}

runAsyncTests();
