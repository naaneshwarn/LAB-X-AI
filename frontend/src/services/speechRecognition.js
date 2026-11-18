/**
 * Provider-abstracted Speech-to-Text (Voice Input) service using browser Web Speech API.
 * Supports English (en-IN), Kannada (kn-IN), Hindi (hi-IN), Telugu (te-IN), and Tamil (ta-IN).
 * Designed so alternative server-side STT providers (e.g., IndicWhisper) can plug in later.
 */

export const RECOGNITION_LOCALE_MAP = {
  en: 'en-IN',
  kn: 'kn-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
};

export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isVoiceInputSupported() {
  return Boolean(getSpeechRecognitionConstructor());
}

const ERROR_MESSAGES = {
  'not-allowed':
    'Microphone permission was denied. Please allow microphone access in your browser site settings.',
  'service-not-allowed':
    'Speech recognition service is blocked by the browser or requires HTTPS / localhost.',
  'no-speech': 'No speech was detected. Please speak clearly near your microphone and try again.',
  'audio-capture': 'No microphone was found on this device.',
  network:
    'Browser speech recognition requires an active internet connection. Please check your network.',
  aborted: 'Voice recording was stopped.',
  'language-not-supported':
    'Your browser speech recognizer does not support the selected language.',
};

export function startVoiceRecognition({
  language = 'en',
  onStart,
  onInterim,
  onResult,
  onError,
  onEnd,
}) {
  const RecognitionCtor = getSpeechRecognitionConstructor();
  if (!RecognitionCtor) {
    onError?.(
      'Voice input (Web SpeechRecognition) is not supported in this browser. Try Chrome or Edge.'
    );
    return null;
  }

  const recognition = new RecognitionCtor();
  recognition.lang = RECOGNITION_LOCALE_MAP[language] || 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  let receivedFinal = false;

  recognition.onstart = () => {
    onStart?.();
  };

  recognition.onresult = (event) => {
    let interim = '';
    let finalText = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) {
        finalText += transcript;
      } else {
        interim += transcript;
      }
    }
    if (interim) onInterim?.(interim.trim());
    if (finalText.trim()) {
      receivedFinal = true;
      onResult?.(finalText.trim(), recognition.lang);
    }
  };

  recognition.onerror = (event) => {
    const code = event?.error || 'unknown';
    const msg =
      ERROR_MESSAGES[code] ||
      `Speech recognition error (${code}). You can type your question directly instead.`;
    onError?.(msg, code);
  };

  recognition.onend = () => {
    if (!receivedFinal) {
      // Do not falsely claim recognition succeeded when nothing was captured
    }
    onEnd?.(receivedFinal);
  };

  try {
    recognition.start();
    return recognition;
  } catch (err) {
    onError?.(err?.message || 'Could not start browser speech recognition.');
    return null;
  }
}
