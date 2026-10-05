import { useState, useEffect, useRef, useCallback } from 'react';
import { aiService } from '../services/aiService';

export type MicState = 'idle' | 'listening' | 'processing' | 'error' | 'permission-denied';

export type MicDetailedErrorType =
  | 'permission-denied'        // Explicitly denied by user or site settings
  | 'permission-dismissed'     // User dismissed permission prompt without answering
  | 'not-found'                // No audio input hardware found
  | 'device-busy'              // Microphone in use by another app or OS audio lock (NotReadableError)
  | 'overconstrained'          // Audio constraints cannot be met
  | 'security-error'           // Insecure context (not HTTPS/localhost) or iframe policy
  | 'abort'                    // Interrupted / aborted by user or OS
  | 'service-unavailable'      // Web Speech cloud service unavailable/unsupported
  | 'network'                  // Network failure during recognition
  | 'no-speech'                // Silence timeout
  | 'unsupported-browser'      // Neither getUserMedia nor SpeechRecognition available
  | 'unknown';

export interface MicErrorInfo {
  type: MicDetailedErrorType;
  message: string;
  canRetry: boolean;
  rawErrorName?: string;
}

interface UseSpeechRecognitionProps {
  onTranscript: (text: string) => void;
  onError?: (errorMessage: string) => void;
  language?: string;
}

/**
 * Log technical debugging metadata in development mode only.
 * NEVER logs audio buffers, binary chunks, base64 data, or sensitive user speech.
 */
function logDevDiagnostic(context: string, data?: Record<string, any>) {
  if (import.meta.env.DEV) {
    if (data) {
      console.debug(`[Voice/Mic Diagnostic] ${context}:`, data);
    } else {
      console.debug(`[Voice/Mic Diagnostic] ${context}`);
    }
  }
}

/**
 * Non-destructively queries the browser's microphone permission state via Permissions API.
 * Returns 'granted' | 'denied' | 'prompt' | 'unsupported'.
 */
export async function queryMicrophonePermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return status.state;
    } catch {
      return 'unsupported';
    }
  }
  return 'unsupported';
}

/**
 * Inspects the exact DOMException / error and maps it to its real technical meaning.
 * Distinguishes NotAllowedError, NotFoundError, NotReadableError, OverconstrainedError, SecurityError, AbortError, etc.
 */
export async function diagnoseMicError(error: any): Promise<MicErrorInfo> {
  const errorName = error?.name || '';
  const rawMessage = error?.message || '';

  // 1. Check browser permission state non-destructively
  const permState = await queryMicrophonePermission();

  // 2. Check available audio input hardware devices
  let audioInputCount = -1;
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      audioInputCount = devices.filter((d) => d.kind === 'audioinput').length;
    } catch {
      // Ignore enumeration failure
    }
  }

  logDevDiagnostic('Error Inspection', {
    errorName,
    rawMessage,
    permissionState: permState,
    hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    hasGetUserMedia: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia,
    audioInputCount,
  });

  // If devices were enumerated and zero audio inputs exist, it's definitely a missing hardware error
  if (audioInputCount === 0) {
    return {
      type: 'not-found',
      message: 'No microphone was detected on your device. Please plug in or connect a microphone and click Retry.',
      canRetry: true,
      rawErrorName: errorName || 'NotFoundError',
    };
  }

  // Handle standard DOMException types from getUserMedia
  switch (errorName) {
    case 'NotAllowedError':
    case 'PermissionDeniedError': {
      if (permState === 'denied') {
        return {
          type: 'permission-denied',
          message: 'Microphone permission is blocked in your browser settings. Please click the camera/microphone icon in your address bar to allow access, then click Retry.',
          canRetry: true,
          rawErrorName: errorName,
        };
      }
      if (permState === 'prompt') {
        return {
          type: 'permission-dismissed',
          message: 'Microphone permission request was dismissed. Click Retry and allow microphone access.',
          canRetry: true,
          rawErrorName: errorName,
        };
      }
      // If permission is 'granted' or 'unsupported' but NotAllowedError occurred:
      // OS privacy settings (e.g. Windows Microphone privacy) or hardware switch blocked access.
      return {
        type: 'permission-denied',
        message: 'Microphone access was blocked by your operating system or browser policy. Please verify your Windows microphone privacy settings and click Retry.',
        canRetry: true,
        rawErrorName: errorName,
      };
    }

    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        type: 'not-found',
        message: 'No microphone was detected on your device. Please plug in or connect a microphone and click Retry.',
        canRetry: true,
        rawErrorName: errorName,
      };

    case 'NotReadableError':
    case 'TrackStartError':
      return {
        type: 'device-busy',
        message: 'Your microphone is currently in use by another application or Windows audio session. Please close other audio applications and click Retry.',
        canRetry: true,
        rawErrorName: errorName,
      };

    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return {
        type: 'overconstrained',
        message: 'The microphone does not support the requested audio settings. Please click Retry.',
        canRetry: true,
        rawErrorName: errorName,
      };

    case 'SecurityError':
      return {
        type: 'security-error',
        message: 'Microphone access is restricted by browser security policy. Please ensure the app is running in a secure context (HTTPS or localhost).',
        canRetry: false,
        rawErrorName: errorName,
      };

    case 'AbortError':
      return {
        type: 'abort',
        message: 'Microphone access was interrupted or aborted by the system. Please click Retry.',
        canRetry: true,
        rawErrorName: errorName,
      };

    case 'TypeError':
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          type: 'unsupported-browser',
          message: 'Your browser does not support microphone audio capture. Please try using a modern browser like Chrome, Edge, or Firefox.',
          canRetry: false,
          rawErrorName: errorName,
        };
      }
      break;
  }

  // Handle SpeechRecognition string errors
  const speechError = typeof error === 'string' ? error : error?.error;
  if (speechError) {
    switch (speechError) {
      case 'not-allowed':
        if (permState === 'denied') {
          return {
            type: 'permission-denied',
            message: 'Microphone permission is blocked in your browser settings. Please allow microphone access in site settings and click Retry.',
            canRetry: true,
            rawErrorName: speechError,
          };
        }
        return {
          type: 'device-busy',
          message: 'Microphone audio capture was blocked by the browser or system. Please verify microphone settings and click Retry.',
          canRetry: true,
          rawErrorName: speechError,
        };

      case 'service-not-allowed':
        return {
          type: 'service-unavailable',
          message: 'Browser speech recognition service is unavailable. Falling back to alternative audio processing.',
          canRetry: true,
          rawErrorName: speechError,
        };

      case 'audio-capture':
        return {
          type: 'not-found',
          message: 'No microphone could be captured. Please check that a microphone is connected and not in use by another app.',
          canRetry: true,
          rawErrorName: speechError,
        };

      case 'network':
        return {
          type: 'network',
          message: 'Network connection issue with speech recognition service. Please check your internet connection and try again.',
          canRetry: true,
          rawErrorName: speechError,
        };

      case 'no-speech':
        return {
          type: 'no-speech',
          message: 'No speech was detected. Please speak into your microphone and try again.',
          canRetry: true,
          rawErrorName: speechError,
        };
    }
  }

  // Safe generic fallback error without falsely claiming permission was denied
  return {
    type: 'unknown',
    message: rawMessage || `Microphone encountered an unexpected error (${errorName || 'Error'}). Please click Retry.`,
    canRetry: true,
    rawErrorName: errorName || 'UnknownError',
  };
}

export function useSpeechRecognition({
  onTranscript,
  onError,
  language = 'en-US',
}: UseSpeechRecognitionProps) {
  const [state, setState] = useState<MicState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<MicErrorInfo | null>(null);
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unsupported'>('prompt');

  // Callback refs to preserve stable function references
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

  // Stream & Recording Lifecycle refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);
  const transcriptReceivedRef = useRef(false);

  // Concurrency & state tracking refs
  const isListeningRef = useRef(false);
  const isStartingRef = useRef(false);
  const isProcessingRef = useRef(false);

  // Initial permission check on mount (non-destructive)
  useEffect(() => {
    queryMicrophonePermission().then((perm) => {
      setPermissionState(perm);
      logDevDiagnostic('Initial permission check', { permissionState: perm });
    });
  }, []);

  /**
   * Safely stops and cleans up all active tracks on the MediaStream.
   * Ensures no lingering microphone streams or audio locks remain.
   */
  const cleanupStream = useCallback(() => {
    if (mediaStreamRef.current) {
      logDevDiagnostic('Cleaning up MediaStream tracks', {
        trackCount: mediaStreamRef.current.getAudioTracks().length,
      });
      mediaStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      mediaStreamRef.current = null;
    }
  }, []);

  /**
   * Stops recording, Web Speech recognition, and active MediaStream tracks cleanly.
   */
  const stopListening = useCallback(() => {
    logDevDiagnostic('stopListening invoked');
    clearTimeout(timeoutRef.current);

    // 1. Stop MediaRecorder if actively recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        logDevDiagnostic('MediaRecorder stop error', { error: (e as any)?.message });
      }
    }

    // 2. Stop Web Speech recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        try {
          recognitionRef.current.abort();
        } catch (abortErr) {}
      }
    }

    // 3. Stop all audio tracks on MediaStream
    cleanupStream();

    isListeningRef.current = false;
    isStartingRef.current = false;
    setState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, [cleanupStream]);

  // Web Speech API initialization and lifecycle management
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      logDevDiagnostic('Web Speech API not present in this browser; MediaRecorder will be used');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'hindi' ? 'hi-IN' : 'en-US';

    recognition.onstart = () => {
      logDevDiagnostic('SpeechRecognition onstart event');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript.trim()) {
        logDevDiagnostic('Web Speech recognized transcript', {
          length: finalTranscript.trim().length,
        });
        transcriptReceivedRef.current = true;
        stopListening();
        setState('processing');
        isProcessingRef.current = true;
        onTranscriptRef.current(finalTranscript.trim());
        isProcessingRef.current = false;
        setState('idle');
      }
    };

    recognition.onerror = async (event: any) => {
      logDevDiagnostic('SpeechRecognition onerror', { error: event.error });

      // If MediaRecorder is actively recording, let MediaRecorder finish and transcribe
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        logDevDiagnostic('SpeechRecognition encountered error, relying on active MediaRecorder', {
          error: event.error,
        });
        return;
      }

      const errInfo = await diagnoseMicError(event);
      setErrorInfo(errInfo);
      setErrorMessage(errInfo.message);

      if (errInfo.type === 'permission-denied' || errInfo.type === 'permission-dismissed') {
        setState('permission-denied');
      } else if (errInfo.type === 'no-speech') {
        setState('idle');
      } else {
        setState('error');
      }

      onErrorRef.current?.(errInfo.message);
    };

    recognition.onend = () => {
      logDevDiagnostic('SpeechRecognition onend event');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language, stopListening]);

  /**
   * Primary entry point: Requests microphone access and begins listening.
   * Follows the complete stream lifecycle:
   * 1. Requests mic using standard navigator.mediaDevices.getUserMedia({ audio: true })
   * 2. Receives MediaStream
   * 3. Stores stream in mediaStreamRef
   * 4. Starts recording / STT process
   * 5. Prevents duplicate requests
   */
  const startListening = useCallback(async () => {
    // 1. Guard against duplicate concurrent requests
    if (isStartingRef.current || isListeningRef.current || isProcessingRef.current) {
      logDevDiagnostic('startListening ignored: already starting or active');
      return;
    }

    isStartingRef.current = true;
    setErrorMessage(null);
    setErrorInfo(null);

    // 2. Compatibility check for MediaDevices
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errInfo = await diagnoseMicError(new TypeError('navigator.mediaDevices.getUserMedia is unavailable'));
      setErrorInfo(errInfo);
      setErrorMessage(errInfo.message);
      setState('error');
      onErrorRef.current?.(errInfo.message);
      isStartingRef.current = false;
      return;
    }

    // 3. Inspect permission state non-destructively
    const permStatus = await queryMicrophonePermission();
    setPermissionState(permStatus);

    if (permStatus === 'denied') {
      const errInfo = await diagnoseMicError({ name: 'NotAllowedError', message: 'Microphone permission denied' });
      setErrorInfo(errInfo);
      setErrorMessage(errInfo.message);
      setState('permission-denied');
      onErrorRef.current?.(errInfo.message);
      isStartingRef.current = false;
      return;
    }

    // 4. Request microphone access using the standard browser API
    let stream: MediaStream;
    try {
      logDevDiagnostic('Requesting getUserMedia audio stream');
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      logDevDiagnostic('getUserMedia request threw error', {
        name: err?.name,
        message: err?.message,
      });

      const errInfo = await diagnoseMicError(err);
      setErrorInfo(errInfo);
      setErrorMessage(errInfo.message);
      setState(
        errInfo.type === 'permission-denied' || errInfo.type === 'permission-dismissed'
          ? 'permission-denied'
          : 'error'
      );
      onErrorRef.current?.(errInfo.message);
      isStartingRef.current = false;
      return;
    }

    // 5. Store stream in ref
    mediaStreamRef.current = stream;
    audioChunksRef.current = [];
    transcriptReceivedRef.current = false;

    // Validate active audio tracks
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) {
      cleanupStream();
      const errInfo = await diagnoseMicError({ name: 'NotFoundError', message: 'No audio tracks found' });
      setErrorInfo(errInfo);
      setErrorMessage(errInfo.message);
      setState('error');
      onErrorRef.current?.(errInfo.message);
      isStartingRef.current = false;
      return;
    }

    // Listen for track ending (e.g. device unplugged or OS revocation)
    audioTracks[0].onended = () => {
      logDevDiagnostic('Audio track ended by device or OS');
      if (isListeningRef.current) {
        stopListening();
        setErrorMessage('Microphone disconnected or stopped sending audio.');
        setState('error');
      }
    };

    // 6. Set up MediaRecorder for robust audio capture & Gemini STT
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/wav';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        logDevDiagnostic('MediaRecorder onstop fired', {
          chunksCount: audioChunksRef.current.length,
          transcriptAlreadyReceived: transcriptReceivedRef.current,
        });

        // Clean up tracks when recording stops
        cleanupStream();

        if (audioChunksRef.current.length === 0 || transcriptReceivedRef.current) {
          if (!transcriptReceivedRef.current) {
            setState('idle');
          }
          return;
        }

        // Send recorded audio to backend Gemini STT
        setState('processing');
        isProcessingRef.current = true;

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            const base64Data = (reader.result as string)?.split(',')[1];
            if (base64Data) {
              const transcript = await aiService.transcribeAudio(base64Data, mimeType);
              logDevDiagnostic('Gemini STT transcription received', {
                hasTranscript: !!transcript,
              });

              if (transcript && transcript.trim()) {
                onTranscriptRef.current(transcript.trim());
              } else {
                setState('idle');
                setErrorMessage('No speech detected. Please speak into your microphone and try again.');
              }
            } else {
              setState('idle');
            }
            isProcessingRef.current = false;
          };
        } catch (sttErr: any) {
          logDevDiagnostic('Gemini STT processing error', { error: sttErr?.message });
          setState('error');
          setErrorMessage('Could not process speech. Please click Retry or type your message.');
          onErrorRef.current?.('Gemini STT error.');
          isProcessingRef.current = false;
        }
      };

      recorder.start(250); // Collect slice every 250ms
    } catch (recErr: any) {
      logDevDiagnostic('MediaRecorder start error', { error: recErr?.message });
    }

    // 7. If native SpeechRecognition is supported, start it concurrently
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (speechErr: any) {
        logDevDiagnostic('Web Speech start error (relying on MediaRecorder)', {
          error: speechErr?.message,
        });
      }
    }

    isListeningRef.current = true;
    isStartingRef.current = false;
    setState('listening');
    setErrorMessage(null);
    setErrorInfo(null);

    // Auto-timeout after 10 seconds of listening
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        logDevDiagnostic('Listening auto-timeout reached (10s)');
        stopListening();
      }
    }, 10000);
  }, [cleanupStream, stopListening]);

  /**
   * Resets all error messages and state back to idle.
   */
  const resetState = useCallback(() => {
    logDevDiagnostic('resetState invoked');
    setErrorMessage(null);
    setErrorInfo(null);
    setState('idle');
    isListeningRef.current = false;
    isStartingRef.current = false;
    isProcessingRef.current = false;
  }, []);

  /**
   * Retry action:
   * 1. Cleans up previous session.
   * 2. Clears error state.
   * 3. Re-checks current browser permission.
   * 4. Re-requests microphone access cleanly without a full page reload.
   */
  const retryListening = useCallback(async () => {
    logDevDiagnostic('retryListening invoked');
    stopListening();
    resetState();
    // Allow React state to settle
    await new Promise((r) => setTimeout(r, 60));
    await startListening();
  }, [stopListening, resetState, startListening]);

  // Clean up all streams and sessions when component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      cleanupStream();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {}
      }
    };
  }, [cleanupStream]);

  return {
    state,
    errorMessage,
    errorInfo,
    startListening,
    stopListening,
    retryListening,
    resetState,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    permissionState,
  };
}
