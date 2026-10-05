import { useState, useEffect, useRef, useCallback } from 'react';

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceList, setVoiceList] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isStoppedRef = useRef(false);
  const pauseTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not supported in this browser.');
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setVoiceList(voices);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }
      if ('speechSynthesis' in window) {
        isStoppedRef.current = true;
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    isStoppedRef.current = true;
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = useCallback(
    (input: string | string[], onEnd?: () => void) => {
      if (!('speechSynthesis' in window) || !input) {
        onEnd?.();
        return;
      }

      isStoppedRef.current = false;
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = null;
      }

      // Stop any ongoing speech before starting new sequence
      window.speechSynthesis.cancel();

      // Normalize input into non-empty clean text sections
      let rawSections: string[] = [];
      if (Array.isArray(input)) {
        rawSections = input;
      } else if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed.includes('\n\n')) {
          rawSections = trimmed.split(/\n\s*\n/);
        } else {
          rawSections = [trimmed];
        }
      }

      const sections = rawSections
        .map((sec) =>
          sec
            .replace(/[*_#`~]/g, '')
            .replace(/:[a-z_]+:/g, '')
            .trim()
        )
        .filter((sec) => sec.length > 0);

      if (sections.length === 0) {
        setIsSpeaking(false);
        onEnd?.();
        return;
      }

      setIsSpeaking(true);

      const speakSection = (index: number) => {
        if (isStoppedRef.current) {
          setIsSpeaking(false);
          return;
        }

        if (index >= sections.length) {
          setIsSpeaking(false);
          onEnd?.();
          return;
        }

        const text = sections[index];
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95; // Slightly slower for clear English learning comprehension
        utterance.pitch = 1.0;

        // Select an English voice
        const preferredVoice =
          voiceList.find(
            (v) =>
              v.lang.startsWith('en') &&
              (v.name.includes('Natural') ||
                v.name.includes('Google') ||
                v.name.includes('Samantha') ||
                v.name.includes('Jenny'))
          ) || voiceList.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          if (isStoppedRef.current) {
            setIsSpeaking(false);
            return;
          }

          const nextIndex = index + 1;
          if (nextIndex < sections.length) {
            // Natural pause between logical sections (400ms feels like a thoughtful teacher pausing)
            pauseTimeoutRef.current = setTimeout(() => {
              if (!isStoppedRef.current) {
                speakSection(nextIndex);
              }
            }, 400);
          } else {
            // All sections completed
            setIsSpeaking(false);
            onEnd?.();
          }
        };

        utterance.onerror = (e) => {
          if (isStoppedRef.current || e.error === 'canceled' || e.error === 'interrupted') {
            setIsSpeaking(false);
            return;
          }

          console.warn('Speech synthesis error on section:', index, e);
          const nextIndex = index + 1;
          if (nextIndex < sections.length) {
            pauseTimeoutRef.current = setTimeout(() => {
              if (!isStoppedRef.current) {
                speakSection(nextIndex);
              }
            }, 300);
          } else {
            setIsSpeaking(false);
            onEnd?.();
          }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      };

      speakSection(0);
    },
    [voiceList]
  );

  return {
    speak,
    stop,
    isSpeaking,
  };
}
