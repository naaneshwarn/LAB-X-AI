/**
 * Modular client-side narration service using browser SpeechSynthesis.
 * Designed so future AI4Bharat Indic-TTS audio streaming can plug into the same interface.
 */

const LOCALE_MAP = {
  en: 'en',
  kn: 'kn',
  hi: 'hi',
  te: 'te',
  ta: 'ta',
};

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getAvailableVoices() {
  if (!isSpeechSupported()) return [];
  return window.speechSynthesis.getVoices() || [];
}

export function findVoicesForLanguage(languageCode) {
  const voices = getAvailableVoices();
  const prefix = (LOCALE_MAP[languageCode] || languageCode || 'en').toLowerCase();
  return voices.filter((v) => (v.lang || '').toLowerCase().startsWith(prefix));
}

export function stripMarkdownForSpeech(text) {
  return String(text || '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[#>*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speakText({ text, language = 'en', voiceURI = '', onStart, onEnd, onError }) {
  if (!isSpeechSupported()) {
    onError?.('Browser SpeechSynthesis is not supported on this device.');
    return { ok: false, voiceFound: false };
  }

  const clean = stripMarkdownForSpeech(text);
  if (!clean) {
    onError?.('No narration text available.');
    return { ok: false, voiceFound: false };
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);

  const voices = getAvailableVoices();
  let chosen = voiceURI ? voices.find((v) => v.voiceURI === voiceURI) : null;
  const matchingLangVoices = findVoicesForLanguage(language);
  if (!chosen && matchingLangVoices.length > 0) {
    chosen = matchingLangVoices[0];
  }

  const voiceFound = Boolean(chosen);
  if (chosen) {
    utterance.voice = chosen;
    utterance.lang = chosen.lang;
  } else {
    utterance.lang = language === 'kn' ? 'kn-IN' : 'en-IN';
  }

  utterance.rate = 0.98;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onError?.('Unable to play audio narration with the selected browser voice.');

  window.speechSynthesis.speak(utterance);
  return { ok: true, voiceFound };
}

export function pauseNarration() {
  if (isSpeechSupported()) window.speechSynthesis.pause();
}

export function resumeNarration() {
  if (isSpeechSupported()) window.speechSynthesis.resume();
}

export function stopNarration() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
